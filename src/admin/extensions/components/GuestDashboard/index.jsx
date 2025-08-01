import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Flex, Button, Loader, EmptyStateLayout, Tabs, Field, Grid } from "@strapi/design-system";
import { useFetchClient } from "@strapi/strapi/admin";
import axios from "axios";

// Importar componentes
import GuestSummary from "./GuestSummary";
import BrideGroomDashboards from "./BrideGroomDashboards";
import ConfirmationProgress from "./ConfirmationProgress";
import GuestList from "./GuestList";
import UploadResultsModal from "./UploadResultsModal";
import GuestFormModal from "./GuestFormModal";

const GuestDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventData, setSelectedEventData] = useState(null);
  const [guests, setGuests] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState({});
  const [guestData, setGuestData] = useState({
    total: 0,
    confirmed: 0,
    declined: 0,
    unknown: 0,
    confirmedGuests: 0,
    maxGuests: 0,
    invitedByBride: 0,
    invitedByGroom: 0,
    confirmedByBride: 0,
    confirmedByGroom: 0,
    confirmedGuestsByBride: 0,
    confirmedGuestsByGroom: 0,
    totalMessages: 0,
  });
  const [activeTab, setActiveTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [invitedByFilter, setInvitedByFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  // Estados para el modal de agregar/editar invitados
  const [showGuestFormModal, setShowGuestFormModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  // WhatsApp API integration
  const [qrStatus, setQrStatus] = useState({
    clientReady: false,
    qrAvailable: false,
  });
  const [qrDialogVisible, setQrDialogVisible] = useState(false);
  const [sendingInvitations, setSendingInvitations] = useState(false);
  const [whatsappError, setWhatsappError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const qrPollInterval = useRef(null);
  const qrImageRef = useRef(null);
  // Global WhatsApp API URL configuration
  const whatsappApiUrl = process.env.WHATSAPP_API_URL || "http://localhost:3001";

  // Use the authenticated fetch client from Strapi
  const { get, post } = useFetchClient();
  const fetchClient = useFetchClient();


  // Fetch available events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: response } = await get(
        "/content-manager/collection-types/api::event.event?populate=*&pagination[pageSize]=100"
      );

      const events = response.results || [];
      setEvents(events);

      // Select the first event by default if there are events and none is selected
      if (events.length > 0 && !selectedEvent) {
        setSelectedEvent(events[0].id);
        setSelectedEventData(events[0]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("No se pudieron cargar los eventos disponibles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedEvent) {
        // If no event is selected, don't fetch guests
        setGuests([]);
        setGuestData({
          total: 0,
          confirmed: 0,
          declined: 0,
          unknown: 0,
          confirmedGuests: 0,
          maxGuests: 0,
          invitedByBride: 0,
          invitedByGroom: 0,
          confirmedByBride: 0,
          confirmedByGroom: 0,
          confirmedGuestsByBride: 0,
          confirmedGuestsByGroom: 0,
          totalMessages: 0,
        });
        setLoading(false);
        return;
      }

      // Fetch guests from our secure admin endpoint using the authenticated client
      // Filter by the selected event and set pagination to get all guests
      const { data: response } = await get(
        `/content-manager/collection-types/api::guest.guest?filters[event][id][$eq]=${selectedEvent}&populate=*&pagination[pageSize]=1000`
      );

      // The useFetchClient automatically handles errors and parsing JSON
      const guests = response.results || [];

      // Fetch event confirmations for this event
      let confirmations = [];
      try {
        const { data: confirmationsResponse } = await get(
          `/event-confirmations/event/${selectedEventData?.documentId || selectedEvent}`
        );
        confirmations = confirmationsResponse || [];
      } catch (confirmationError) {
        console.log('No event confirmations found for this event');
        confirmations = [];
      }

      // Merge guest data with confirmation data
      const guestsWithConfirmations = guests.map(guest => {
        const confirmation = confirmations.find(c => c.guest.documentId === guest.documentId);
        return {
          ...guest,
          confirmed: confirmation?.confirmed || 'unknown',
          confirmedGuests: confirmation?.confirmedGuests || null
        };
      });

      // Store the guests list with confirmation data
      setGuests(guestsWithConfirmations);

      // Reset selected guests when refreshing data
      setSelectedGuests({});

      // Process the data based on confirmations from event-confirmations API
      const total = guestsWithConfirmations.length;
      const confirmed = confirmations.filter(c => c?.confirmed === 'yes').length;
      const declined = confirmations.filter(c => c?.confirmed === 'no').length;
      const unknown = total - confirmed - declined;

      // Calculate total confirmed guests based on confirmation data
      const confirmedGuests = confirmations
        .filter(c => c?.confirmed === 'yes')
        .reduce((sum, c) => sum + (c?.confirmedGuests || c?.guest?.maxGuests || 0), 0);

      // Calculate maximum possible guests
      const maxGuests = guests.reduce((sum, guest) => sum + guest.maxGuests, 0);

      // Calculate guests invited by bride and groom
      const invitedByBride = guests.filter(
        (guest) => guest.invitedBy === "Bride"
      ).length;
      const invitedByGroom = guests.filter(
        (guest) => guest.invitedBy === "Groom"
      ).length;

      // Calculate confirmed invitations by bride and groom using confirmations
      const brideConfirmations = confirmations.filter(c => c?.guest?.invitedBy === 'Bride');
      const groomConfirmations = confirmations.filter(c => c?.guest?.invitedBy === 'Groom');
      
      const confirmedByBride = brideConfirmations.filter(c => c?.confirmed === 'yes').length;
      const confirmedByGroom = groomConfirmations.filter(c => c?.confirmed === 'yes').length;

      // Calculate total confirmed guests by bride and groom
      const confirmedGuestsByBride = brideConfirmations
        .filter(c => c?.confirmed === 'yes')
        .reduce((sum, c) => sum + (c?.confirmedGuests || c?.guest?.maxGuests || 0), 0);
      const confirmedGuestsByGroom = groomConfirmations
        .filter(c => c?.confirmed === 'yes')
        .reduce((sum, c) => sum + (c?.confirmedGuests || c?.guest?.maxGuests || 0), 0);

      // Set total messages to 0 since message field has been removed
      const totalMessages = 0;

      setGuestData({
        total,
        confirmed,
        declined,
        unknown,
        confirmedGuests,
        maxGuests,
        invitedByBride,
        invitedByGroom,
        confirmedByBride,
        confirmedByGroom,
        confirmedGuestsByBride,
        confirmedGuestsByGroom,
        totalMessages,
      });
    } catch (err) {
      console.error("Error fetching guest data:", err);
      setError("No se pudieron cargar los datos de invitados.");
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox selection
  const handleSelectGuest = (guestId) => {
    setSelectedGuests((prev) => ({
      ...prev,
      [guestId]: !prev[guestId],
    }));
  };

  // Handle select all guests
  const handleSelectAll = () => {
    const allSelected = guests.every(
      (guest) => selectedGuests[guest.documentId]
    );

    if (allSelected) {
      // If all are selected, unselect all
      setSelectedGuests({});
    } else {
      // Otherwise, select all
      const newSelected = {};
      guests.forEach((guest) => {
        newSelected[guest.documentId] = true;
      });
      setSelectedGuests(newSelected);
    }
  };

  // Get QR code image
  const updateQrImage = async () => {
    if (!qrStatus.qrAvailable || qrStatus.clientReady || !qrImageRef.current) {
      return;
    }

    // Check if WhatsApp API URL is available
    if (!whatsappApiUrl) {
      console.error("WhatsApp API URL is not configured for this event");
      setWhatsappError("No se ha configurado la URL del servicio de WhatsApp para este evento");
      return;
    }

    try {
      // Set a timestamp to prevent caching
      const timestamp = new Date().getTime();

      // Create a data URL for the QR code using a proxy approach
      try {
        // Try to get the QR image using our proxy function
        const response = await axios({
          method: "GET",
          url: `${whatsappApiUrl}/qr/image?t=${timestamp}`,
          responseType: "blob",
          headers: {
            "Referrer-Policy": "no-referrer",
            Origin: window.location.origin,
            mode: "cors",
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
          },
        });

        // Create a blob URL from the response
        const blob = new Blob([response.data], { type: "image/png" });
        const url = URL.createObjectURL(blob);

        // Set the image source
        if (qrImageRef.current) {
          qrImageRef.current.src = url;
          console.log("QR image loaded successfully via proxy");
        }
      } catch (err) {
        console.error("Error loading QR image via proxy:", err);

        // Fallback: try loading the image directly
        const imageUrl = `${whatsappApiUrl}/qr/image?t=${timestamp}`;
        console.log("Trying direct image load from:", imageUrl);

        if (qrImageRef.current) {
          qrImageRef.current.src = imageUrl;

          qrImageRef.current.onload = () => {
            console.log("QR image loaded successfully via direct URL");
          };

          qrImageRef.current.onerror = () => {
            console.error("Failed to load QR image directly");
            setWhatsappError(
              "No se pudo cargar el código QR. Intente refrescar la página."
            );
          };
        }
      }
    } catch (err) {
      console.error("Error updating QR image:", err);
      setWhatsappError(
        `Error al actualizar la imagen del código QR: ${err.message}`
      );
    }
  };

  // Handle CSV file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Read the file as text
      const fileReader = new FileReader();

      fileReader.onload = async (e) => {
        // Ensure we have a string
        const csvText = String(e.target.result);

        // Parse CSV to JSON
        const rows = [];
        const lines = csvText.split("\n");
        const headers = lines[0].split(",").map((header) => header.trim());

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines

          const values = lines[i].split(",").map((value) => value.trim());
          const row = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          rows.push(row);
        }

        // Initialize results object
        const results = {
          total: rows.length,
          created: 0,
          duplicates: [],
          errors: [],
        };

        // Process each row individually
        for (const row of rows) {
          try {
            // Validate required fields
            if (!row.name) {
              results.errors.push({ row, error: "Falta el campo nombre" });
              continue;
            }

            // Check for duplicates by phone number
            if (row.phone) {
              try {
                // Search for existing guest with same phone number using Content Manager API
                const { data: existingGuests } = await fetchClient.get(
                  `/content-manager/collection-types/api::guest.guest?filters[phone][$eq]=${row.phone}&populate=*&pagination[pageSize]=100`
                );

                if (
                  existingGuests &&
                  existingGuests.results &&
                  existingGuests.results.length > 0
                ) {
                  const existingGuest = existingGuests.results[0];
                  results.duplicates.push({
                    row,
                    existing: {
                      id: existingGuest.id,
                      name: existingGuest.name,
                      phone: existingGuest.phone,
                    },
                  });
                  continue;
                }
              } catch (error) {
                console.error("Error checking for duplicates:", error);
              }
            }

            // Log the row data for debugging
            console.log("Row data:", row);

            // Prepare guest data
            const guestData = {
              name: row.name.trim(),
              phone: row.phone ? row.phone.trim() : null,
              maxGuests: row.maxGuests ? parseInt(row.maxGuests) : 1,
              confirmedGuests: null,
              confirmed: "unknown",
              invitedBy: row.invitedBy ? row.invitedBy.trim() : null,
              timesSended: 0,
            };

            // Log the prepared data for debugging
            console.log("Prepared guest data:", guestData);

            // Create the guest using the Content Manager API
            // Add the event ID to the guest data
            const guestDataWithEvent = {
              ...guestData,
              event: selectedEvent
            };

            const response = await fetchClient.post(
              "/content-manager/collection-types/api::guest.guest",
              guestDataWithEvent
            );

            // Log the response for debugging
            console.log("Create guest response:", response);

            results.created++;
          } catch (error) {
            console.error("Error creating guest:", error);
            results.errors.push({
              row,
              error: error.message || "Error desconocido al crear invitado",
            });
          }
        }

        // Show results
        setUploadResults(results);
        setShowUploadDialog(true);

        // Refresh data after successful upload
        fetchGuestData();
      };

      fileReader.onerror = () => {
        alert("Error reading file");
      };

      fileReader.readAsText(file);
    } catch (error) {
      console.error("Error handling file upload:", error);
      alert(`Error handling file upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Download sample CSV file
  const downloadSampleCSV = () => {
    // Create sample data
    const sampleData = [
      {
        name: "Juan Pérez",
        phone: "5512345678",
        maxGuests: "2",
        invitedBy: "Groom",
      },
      {
        name: "María García",
        phone: "5587654321",
        maxGuests: "3",
        invitedBy: "Bride",
      },
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]).join(",");
    const rows = sampleData.map((obj) => Object.values(obj).join(","));
    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "invitados_ejemplo.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close upload results dialog
  const closeUploadDialog = () => {
    setShowUploadDialog(false);
    setUploadResults(null);
  };

  // Function to update timesSended for selected guests
  const updateTimesSendedForSelectedGuests = async (guestIds) => {
    try {
      // Process each guest one by one to update timesSended
      for (const documentId of guestIds) {
        // Find the guest in the current list
        const guest = guests.find(g => g.documentId === documentId);
        
        if (guest) {
          // Increment timesSended
          const updatedTimesSended = (guest.timesSended || 0) + 1;
          
          // Update the guest using the Content Manager API
          await axios({
            method: "PUT",
            url: `/content-manager/collection-types/api::guest.guest/${documentId}`,
            data: {
              timesSended: updatedTimesSended
            },
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
            },
          });
          
          console.log(`Updated timesSended for guest ${guest.name} to ${updatedTimesSended}`);
        }
      }
    } catch (error) {
      console.error("Error updating timesSended:", error);
    }
  };

  // Send WhatsApp invitations to selected guests via API
  const sendWhatsAppInvitations = async () => {
    const selectedGuestIds = Object.keys(selectedGuests).filter(
      (id) => selectedGuests[id]
    );

    if (selectedGuestIds.length === 0) {
      alert("Por favor selecciona al menos un invitado");
      return;
    }

    // Check if WhatsApp API URL is available
    if (!whatsappApiUrl) {
      alert("No se ha configurado la URL del servicio de WhatsApp para este evento. Por favor, configura la URL en la configuración del evento.");
      return;
    }

    try {
      setSendingInvitations(true);

      // Call the API to send invitations to selected guests using our proxy function
      const response = await axios({
        method: "POST",
        url: `${whatsappApiUrl}/sendInvitationsToSpecificGuests`,
        data: {
          documentIds: selectedGuestIds,
          eventId: selectedEvent, // Incluir el ID del evento seleccionado
        },
        headers: {
          "Content-Type": "application/json",
          "Referrer-Policy": "no-referrer",
          Origin: window.location.origin,
          mode: "cors",
          Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // With axios, the data is already parsed
      const result = response.data;

      console.log("Invitation response:", result);

      alert(
        `Invitaciones enviadas correctamente a ${result.data?.count || 0} invitados`
      );

      // Update timesSended for selected guests
      await updateTimesSendedForSelectedGuests(selectedGuestIds);
      
      // Refresh data to update UI
      fetchGuestData();
      
      // Reset selected guests
      setSelectedGuests({});
    } catch (err) {
      console.error("Error sending invitations:", err);
      alert("Error al enviar invitaciones: " + err.message);
    } finally {
      setSendingInvitations(false);
    }
  };
  
  // Send WhatsApp reminders to selected guests via API
  const sendWhatsAppReminders = async () => {
    const selectedGuestIds = Object.keys(selectedGuests).filter(
      (id) => selectedGuests[id]
    );

    if (selectedGuestIds.length === 0) {
      alert("Por favor selecciona al menos un invitado");
      return;
    }

    // Check if WhatsApp API URL is available
    if (!whatsappApiUrl) {
      alert("No se ha configurado la URL del servicio de WhatsApp para este evento. Por favor, configura la URL en la configuración del evento.");
      return;
    }

    // Filter only guests that have already received an invitation (timesSended > 0)
    const guestsWithInvitation = guests.filter(
      (guest) => selectedGuests[guest.documentId] && guest.timesSended > 0
    );
    
    const guestIdsWithInvitation = guestsWithInvitation.map(guest => guest.documentId);
    
    if (guestIdsWithInvitation.length === 0) {
      alert("Ninguno de los invitados seleccionados ha recibido una invitación previa");
      return;
    }

    try {
      setSendingInvitations(true);

      // Call the API to send reminders to selected guests
      const response = await axios({
        method: "POST",
        url: `${whatsappApiUrl}/sendReminders`,
        data: {
          documentIds: guestIdsWithInvitation,
          eventId: selectedEvent, // Incluir el ID del evento seleccionado
        },
        headers: {
          "Content-Type": "application/json",
          "Referrer-Policy": "no-referrer",
          Origin: window.location.origin,
          mode: "cors",
          Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
        },
        timeout: 10000, // 10 second timeout
      });

      // With axios, the data is already parsed
      const result = response.data;

      console.log("Reminder response:", result);

      alert(
        `Recordatorios enviados correctamente a ${result.data?.count || 0} invitados`
      );

      // Update timesSended for selected guests
      await updateTimesSendedForSelectedGuests(guestIdsWithInvitation);
      
      // Refresh data to update UI
      fetchGuestData();
      
      // Reset selected guests
      setSelectedGuests({});
    } catch (err) {
      console.error("Error sending reminders:", err);
      alert("Error al enviar recordatorios: " + err.message);
    } finally {
      setSendingInvitations(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch guest data when selected event changes
  useEffect(() => {
    if (selectedEvent) {
      // Find the selected event data
      const eventData = events.find(event => event.id === selectedEvent);
      if (eventData) {
        setSelectedEventData(eventData);
      }
      fetchGuestData();
    }
  }, [selectedEvent, events]);

  // Funciones para agregar, editar y eliminar invitados
  const handleAddGuest = () => {
    setEditingGuest(null);
    setShowGuestFormModal(true);
  };

  const handleEditGuest = (guest) => {
    setEditingGuest(guest);
    setShowGuestFormModal(true);
  };

  const handleDeleteGuest = async (documentId) => {
    if (!window.confirm("¿Está seguro que desea eliminar este invitado?")) {
      return;
    }

    try {
      setLoading(true);
      // Usar el método correcto para eliminar
      await axios({
        method: "DELETE",
        url: `/content-manager/collection-types/api::guest.guest/${documentId}`,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
        },
      });
      
      // Actualizar la lista de invitados
      fetchGuestData();
    } catch (error) {
      console.error("Error al eliminar invitado:", error);
      alert("Error al eliminar invitado: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitGuestForm = async (formData, documentId) => {
    try {
      setIsSubmittingGuest(true);
      
      // Add the event ID to the form data
      const formDataWithEvent = {
        ...formData,
        event: selectedEvent
      };
      
      if (documentId) {
        // Editar invitado existente
        // Usar axios para tener más control sobre la solicitud
        await axios({
          method: "PUT",
          url: `/content-manager/collection-types/api::guest.guest/${documentId}`,
          data: formDataWithEvent,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, "")}`,
          },
        });
      } else {
        // Crear nuevo invitado
        await fetchClient.post("/content-manager/collection-types/api::guest.guest", formDataWithEvent);
      }
      
      // Cerrar modal y actualizar datos
      setShowGuestFormModal(false);
      fetchGuestData();
    } catch (error) {
      console.error("Error al guardar invitado:", error);
      alert("Error al guardar invitado: " + error.message);
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  // Calculate percentages
  const confirmedPercentage =
    guestData.total > 0
      ? Math.round((guestData.confirmed / guestData.total) * 100)
      : 0;
  const declinedPercentage =
    guestData.total > 0
      ? Math.round((guestData.declined / guestData.total) * 100)
      : 0;
  const unknownPercentage =
    guestData.total > 0
      ? Math.round((guestData.unknown / guestData.total) * 100)
      : 0;
  const attendancePercentage =
    guestData.maxGuests > 0
      ? Math.round((guestData.confirmedGuests / guestData.maxGuests) * 100)
      : 0;

  if (loading) {
    return (
      <Box padding={8} background="neutral100">
        <Typography variant="alpha" paddingBottom={4}>
          Dashboard de Invitados
        </Typography>
        <Flex
          justifyContent="center"
          alignItems="center"
          style={{ height: "50vh" }}
        >
          <Loader>Cargando datos de invitados...</Loader>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8} background="neutral100">
        <Flex
          justifyContent="space-between"
          alignItems="center"
          paddingBottom={4}
        >
          <Typography variant="alpha">Dashboard de Invitados</Typography>
          <Button onClick={fetchGuestData}>Reintentar</Button>
        </Flex>
        <EmptyStateLayout
          content={error}
          action={<Button onClick={fetchGuestData}>Reintentar</Button>}
        />
      </Box>
    );
  }

  return (
    <>
      <Box padding={4} background="neutral100">
        <Flex
          justifyContent="space-between"
          alignItems="center"
          paddingBottom={2}
        >
          <Box>
            <Typography variant="beta">Dashboard de Invitados</Typography>
          </Box>
          <Button onClick={fetchGuestData} size="S">
            Refrescar
          </Button>
        </Flex>

        {/* Selector de Eventos */}
        <Box marginBottom={4}>
          <div>
            <Typography variant="pi" fontWeight="bold">
              Seleccionar Evento
            </Typography>
            <div style={{ marginTop: '8px' }}>
              <select
                value={selectedEvent || ""}
                onChange={(e) => {
                  const newSelectedEventId = e.target.value;
                  setSelectedEvent(newSelectedEventId);
                  // Find the selected event data
                  const eventData = events.find(event => event.id === newSelectedEventId);
                  if (eventData) {
                    setSelectedEventData(eventData);
                  }
                }}
                style={{
                  height: "40px",
                  width: "100%",
                  padding: "0 12px",
                  borderRadius: "4px",
                  border: "1px solid #dcdce4",
                  background: "#ffffff",
                  fontSize: "14px",
                }}
              >
                <option value="" disabled>
                  Selecciona un evento
                </option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Display the current WhatsApp service URL */}
          {selectedEventData && (
            <Box marginTop={2}>
              <Typography variant="pi" fontWeight="bold">
                URL del Servicio de WhatsApp
              </Typography>
              <Box marginTop={1}>
                <Typography variant="pi" style={{ wordBreak: "break-all" }}>
                  {whatsappApiUrl ? whatsappApiUrl : "No configurado"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {!selectedEvent && (
          <Box padding={6} background="neutral0" shadow="filterShadow" hasRadius>
            <EmptyStateLayout
              icon={<span>📅</span>}
              content="Por favor selecciona un evento para ver sus invitados"
            />
          </Box>
        )}
{selectedEvent && (
  <>
    {/* Componentes del Dashboard */}
    <GuestSummary guestData={guestData} />
    
    <BrideGroomDashboards guestData={guestData} />
    
    <ConfirmationProgress
      confirmedPercentage={confirmedPercentage}
      declinedPercentage={declinedPercentage}
      unknownPercentage={unknownPercentage}
    />
    
    {/* Tabs para separar invitados por estado */}
    <Box marginTop={4}>
      <Tabs.Root defaultValue="no-invitation" onValueChange={(value) => setActiveTab(["no-invitation", "pending", "confirmed"].indexOf(value))}>
        <Tabs.List aria-label="Tabs de invitados">
          <Tabs.Trigger value="no-invitation">Sin invitación enviada</Tabs.Trigger>
          <Tabs.Trigger value="pending">Invitación enviada sin confirmar</Tabs.Trigger>
          <Tabs.Trigger value="confirmed">Confirmados</Tabs.Trigger>
        </Tabs.List>
        
        {/* Tab 1: Invitados sin invitación enviada */}
        <Tabs.Content value="no-invitation">
          <Box padding={4}>
            <GuestList
              guests={guests.filter(guest => guest.timesSended === 0)}
              selectedGuests={selectedGuests}
              handleSelectGuest={handleSelectGuest}
              handleSelectAll={handleSelectAll}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              invitedByFilter={invitedByFilter}
              setInvitedByFilter={setInvitedByFilter}
              triggerFileUpload={triggerFileUpload}
              isUploading={isUploading}
              downloadSampleCSV={downloadSampleCSV}
              sendWhatsAppInvitations={sendWhatsAppInvitations}
              sendWhatsAppReminders={sendWhatsAppReminders}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              onAddGuest={handleAddGuest}
              onEditGuest={handleEditGuest}
              onDeleteGuest={handleDeleteGuest}
            />
          </Box>
        </Tabs.Content>
        
        {/* Tab 2: Invitados con invitación enviada pero sin confirmar */}
        <Tabs.Content value="pending">
          <Box padding={4}>
            <GuestList
              guests={guests.filter(guest =>
                guest.timesSended > 0 &&
                (guest.confirmed === "unknown" || !guest.confirmed)
              )}
              selectedGuests={selectedGuests}
              handleSelectGuest={handleSelectGuest}
              handleSelectAll={handleSelectAll}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              invitedByFilter={invitedByFilter}
              setInvitedByFilter={setInvitedByFilter}
              triggerFileUpload={triggerFileUpload}
              isUploading={isUploading}
              downloadSampleCSV={downloadSampleCSV}
              sendWhatsAppInvitations={sendWhatsAppInvitations}
              sendWhatsAppReminders={sendWhatsAppReminders}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              onAddGuest={handleAddGuest}
              onEditGuest={handleEditGuest}
              onDeleteGuest={handleDeleteGuest}
            />
          </Box>
        </Tabs.Content>
        
        {/* Tab 3: Invitados confirmados */}
        <Tabs.Content value="confirmed">
          <Box padding={4}>
            <GuestList
              guests={guests.filter(guest => guest.confirmed === "yes")}
              selectedGuests={selectedGuests}
              handleSelectGuest={handleSelectGuest}
              handleSelectAll={handleSelectAll}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              invitedByFilter={invitedByFilter}
              setInvitedByFilter={setInvitedByFilter}
              triggerFileUpload={triggerFileUpload}
              isUploading={isUploading}
              downloadSampleCSV={downloadSampleCSV}
              sendWhatsAppInvitations={sendWhatsAppInvitations}
              sendWhatsAppReminders={sendWhatsAppReminders}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              onAddGuest={handleAddGuest}
              onEditGuest={handleEditGuest}
              onDeleteGuest={handleDeleteGuest}
            />
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  </>
)}
</Box>

      {/* Modal de resultados de importación */}
      {showUploadDialog && (
        <UploadResultsModal
          uploadResults={uploadResults}
          closeUploadDialog={closeUploadDialog}
        />
      )}

      {/* Modal de agregar/editar invitados */}
      <GuestFormModal
        isVisible={showGuestFormModal}
        onClose={() => setShowGuestFormModal(false)}
        onSubmit={handleSubmitGuestForm}
        initialData={editingGuest}
        isSubmitting={isSubmittingGuest}
      />
    </>
  );
};

export default GuestDashboard;
