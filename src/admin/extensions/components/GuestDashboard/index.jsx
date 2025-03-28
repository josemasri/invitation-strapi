import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  Flex,
  Button,
  Loader,
  EmptyStateLayout,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Checkbox,
  VisuallyHidden,
  Alert,
  Portal,
  Dialog,
} from "@strapi/design-system";
import { useFetchClient, useAuth } from "@strapi/strapi/admin";
import axios from "axios";
// We'll use a simple alert instead of the notification system

const StatCard = ({ title, value, description, color = "neutral800" }) => {
  return (
    <Card padding={2} style={{ height: "100%" }}>
      <Flex direction="column" alignItems="flex-start" gap={1}>
        <Typography variant="pi" fontWeight="bold" textColor={color}>
          {title}
        </Typography>
        <Typography variant="delta" fontWeight="bold" textColor={color}>
          {value}
        </Typography>
        {description && (
          <Typography
            variant="pi"
            textColor="neutral600"
            style={{ fontSize: "0.75rem" }}
          >
            {description}
          </Typography>
        )}
      </Flex>
    </Card>
  );
};

const GuestDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [invitedByFilter, setInvitedByFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
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
  const whatsappApiUrl = "https://vww4g4ks4kwk4s0koowkw0gg.s1.josemasri.com"; // WhatsApp API URL

  // Use the authenticated fetch client from Strapi
  const { get, post } = useFetchClient();
  const fetchClient = useFetchClient();

  const fetchGuestData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch guests from our secure admin endpoint using the authenticated client
      const { data: response } = await get(
        "/content-manager/collection-types/api::guest.guest?populate=*"
      );

      // The useFetchClient automatically handles errors and parsing JSON
      const guests = response.results || [];

      // Store the guests list
      setGuests(guests);

      // Reset selected guests when refreshing data
      setSelectedGuests({});

      // Process the data based on the actual API response
      const total = guests.length;
      const confirmed = guests.filter(
        (guest) => guest.confirmed === "yes"
      ).length;
      const declined = guests.filter(
        (guest) => guest.confirmed === "no"
      ).length;
      const unknown = guests.filter(
        (guest) => guest.confirmed === "unknown" || !guest.confirmed
      ).length;

      // Calculate total confirmed guests based on maxGuests field
      const confirmedGuests = guests
        .filter((guest) => guest.confirmed === "yes")
        .reduce(
          (sum, guest) => sum + (guest.confirmedGuests || guest.maxGuests),
          0
        );

      // Calculate maximum possible guests
      const maxGuests = guests.reduce((sum, guest) => sum + guest.maxGuests, 0);

      // Calculate guests invited by bride and groom
      const invitedByBride = guests.filter(
        (guest) => guest.invitedBy === "Bride"
      ).length;
      const invitedByGroom = guests.filter(
        (guest) => guest.invitedBy === "Groom"
      ).length;

      // Calculate confirmed invitations by bride and groom
      const confirmedByBride = guests.filter(
        (guest) => guest.invitedBy === "Bride" && guest.confirmed === "yes"
      ).length;
      const confirmedByGroom = guests.filter(
        (guest) => guest.invitedBy === "Groom" && guest.confirmed === "yes"
      ).length;

      // Calculate total confirmed guests by bride and groom
      const confirmedGuestsByBride = guests
        .filter((guest) => guest.invitedBy === "Bride" && guest.confirmed === "yes")
        .reduce(
          (sum, guest) => sum + (guest.confirmedGuests || guest.maxGuests),
          0
        );
      const confirmedGuestsByGroom = guests
        .filter((guest) => guest.invitedBy === "Groom" && guest.confirmed === "yes")
        .reduce(
          (sum, guest) => sum + (guest.confirmedGuests || guest.maxGuests),
          0
        );

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
                  `/content-manager/collection-types/api::guest.guest?filters[phone][$eq]=${row.phone}&populate=*`
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
            const response = await fetchClient.post(
              "/content-manager/collection-types/api::guest.guest",
              guestData
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

  // Send WhatsApp invitations to selected guests via API
  const sendWhatsAppInvitations = async () => {
    const selectedGuestIds = Object.keys(selectedGuests).filter(
      (id) => selectedGuests[id]
    );

    if (selectedGuestIds.length === 0) {
      alert("Por favor selecciona al menos un invitado");
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

      // Reset selected guests
      setSelectedGuests({});
    } catch (err) {
      console.error("Error sending invitations:", err);
      alert("Error al enviar invitaciones: " + err.message);
    } finally {
      setSendingInvitations(false);
    }
  };

  useEffect(() => {
    fetchGuestData();
  }, []);

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
            <Typography variant="pi" textColor="neutral600">
              Estadísticas y gráficos sobre los invitados a la boda
            </Typography>
          </Box>
          <Button onClick={fetchGuestData} size="S">
            Refrescar
          </Button>
        </Flex>

        <Box paddingBottom={3}>
          <Typography variant="epsilon" fontWeight="bold" paddingBottom={2}>
            Resumen y Distribución
          </Typography>

          <Flex gap={2} wrap="wrap">
            <Box width="calc(20% - 8px)" marginBottom={2}>
              <StatCard
                title="Total Invitaciones"
                value={guestData.total}
                description="Total enviadas"
              />
            </Box>

            <Box width="calc(20% - 8px)" marginBottom={2}>
              <StatCard
                title="Asistencia"
                value={`${guestData.confirmedGuests}/${guestData.maxGuests}`}
                description={`${attendancePercentage}% esperada`}
                color="success600"
              />
            </Box>

            <Box width="calc(20% - 8px)" marginBottom={2}>
              <StatCard
                title="Confirmados"
                value={`${guestData.confirmed} (${confirmedPercentage}%)`}
                description="Han confirmado"
                color="success600"
              />
            </Box>

            <Box width="calc(20% - 8px)" marginBottom={2}>
              <StatCard
                title="Rechazados"
                value={`${guestData.declined} (${declinedPercentage}%)`}
                description="Han declinado"
                color="danger600"
              />
            </Box>

            <Box width="calc(20% - 8px)" marginBottom={2}>
              <StatCard
                title="Pendientes"
                value={`${guestData.unknown} (${unknownPercentage}%)`}
                description="Sin responder"
                color="warning600"
              />
            </Box>
          </Flex>

        </Box>

        <Box paddingBottom={3}>
          <Typography variant="epsilon" fontWeight="bold" paddingBottom={2}>
            Dashboard de Invitados por Novia y Novio
          </Typography>

          <Flex gap={2} wrap="wrap">
            <Box width="calc(50% - 8px)" marginBottom={2}>
              <Card padding={3}>
                <Typography variant="delta" fontWeight="bold" textColor="primary600" paddingBottom={2}>
                  Dashboard de la Novia
                </Typography>
                <Flex gap={2} wrap="wrap">
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Total Invitados"
                      value={guestData.invitedByBride}
                      description={`${Math.round((guestData.invitedByBride / guestData.total) * 100)}% del total`}
                      color="primary600"
                    />
                  </Box>
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Confirmados"
                      value={guestData.confirmedByBride}
                      description={`${guestData.invitedByBride > 0 ? Math.round((guestData.confirmedByBride / guestData.invitedByBride) * 100) : 0}% de tasa de confirmación`}
                      color="primary600"
                    />
                  </Box>
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Personas"
                      value={guestData.confirmedGuestsByBride}
                      description="Asistentes confirmados"
                      color="primary600"
                    />
                  </Box>
                </Flex>
                <Box paddingTop={2}>
                  <Box
                    background="neutral200"
                    height="8px"
                    borderRadius="4px"
                    overflow="hidden"
                    marginTop={2}
                  >
                    <Box
                      background="primary600"
                      height="100%"
                      width={`${guestData.invitedByBride > 0 ? Math.round((guestData.confirmedByBride / guestData.invitedByBride) * 100) : 0}%`}
                      style={{ transition: "width 0.5s ease" }}
                    />
                  </Box>
                </Box>
              </Card>
            </Box>

            <Box width="calc(50% - 8px)" marginBottom={2}>
              <Card padding={3}>
                <Typography variant="delta" fontWeight="bold" textColor="secondary600" paddingBottom={2}>
                  Dashboard del Novio
                </Typography>
                <Flex gap={2} wrap="wrap">
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Total Invitados"
                      value={guestData.invitedByGroom}
                      description={`${Math.round((guestData.invitedByGroom / guestData.total) * 100)}% del total`}
                      color="secondary600"
                    />
                  </Box>
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Confirmados"
                      value={guestData.confirmedByGroom}
                      description={`${guestData.invitedByGroom > 0 ? Math.round((guestData.confirmedByGroom / guestData.invitedByGroom) * 100) : 0}% de tasa de confirmación`}
                      color="secondary600"
                    />
                  </Box>
                  <Box width="calc(33% - 4px)">
                    <StatCard
                      title="Personas"
                      value={guestData.confirmedGuestsByGroom}
                      description="Asistentes confirmados"
                      color="secondary600"
                    />
                  </Box>
                </Flex>
                <Box paddingTop={2}>
                  <Box
                    background="neutral200"
                    height="8px"
                    borderRadius="4px"
                    overflow="hidden"
                    marginTop={2}
                  >
                    <Box
                      background="secondary600"
                      height="100%"
                      width={`${guestData.invitedByGroom > 0 ? Math.round((guestData.confirmedByGroom / guestData.invitedByGroom) * 100) : 0}%`}
                      style={{ transition: "width 0.5s ease" }}
                    />
                  </Box>
                </Box>
              </Card>
            </Box>
          </Flex>
        </Box>

        <Box paddingBottom={3}>
          <Typography variant="epsilon" fontWeight="bold" paddingBottom={2}>
            Progreso de Confirmaciones
          </Typography>

          <Card padding={2}>
            <Flex gap={2} wrap="wrap">
              <Box width="calc(33.33% - 8px)">
                <Flex justifyContent="space-between" paddingBottom={1}>
                  <Typography
                    variant="pi"
                    fontWeight="bold"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Confirmados
                  </Typography>
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    {confirmedPercentage}%
                  </Typography>
                </Flex>
                <Box
                  background="neutral200"
                  height="8px"
                  borderRadius="4px"
                  overflow="hidden"
                >
                  <Box
                    background="success600"
                    height="100%"
                    width={`${confirmedPercentage}%`}
                    style={{ transition: "width 0.5s ease" }}
                  />
                </Box>
              </Box>

              <Box width="calc(33.33% - 8px)">
                <Flex justifyContent="space-between" paddingBottom={1}>
                  <Typography
                    variant="pi"
                    fontWeight="bold"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Rechazados
                  </Typography>
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    {declinedPercentage}%
                  </Typography>
                </Flex>
                <Box
                  background="neutral200"
                  height="8px"
                  borderRadius="4px"
                  overflow="hidden"
                >
                  <Box
                    background="danger600"
                    height="100%"
                    width={`${declinedPercentage}%`}
                    style={{ transition: "width 0.5s ease" }}
                  />
                </Box>
              </Box>

              <Box width="calc(33.33% - 8px)">
                <Flex justifyContent="space-between" paddingBottom={1}>
                  <Typography
                    variant="pi"
                    fontWeight="bold"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Pendientes
                  </Typography>
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    {unknownPercentage}%
                  </Typography>
                </Flex>
                <Box
                  background="neutral200"
                  height="8px"
                  borderRadius="4px"
                  overflow="hidden"
                >
                  <Box
                    background="warning600"
                    height="100%"
                    width={`${unknownPercentage}%`}
                    style={{ transition: "width 0.5s ease" }}
                  />
                </Box>
              </Box>
            </Flex>
          </Card>
        </Box>

        <Box paddingBottom={3}>
          <Flex
            justifyContent="space-between"
            alignItems="flex-start"
            paddingBottom={2}
          >
            <Typography variant="epsilon" fontWeight="bold">
              Lista de Invitados
            </Typography>
            <Flex
              gap={2}
              alignItems="center"
              wrap="wrap"
              style={{ maxWidth: "70%" }}
            >
              <Flex gap={1}>
                <Button
                  onClick={triggerFileUpload}
                  variant="secondary"
                  size="S"
                  disabled={isUploading}
                >
                  {isUploading ? "Subiendo..." : "Importar CSV"}
                </Button>
                <Button onClick={downloadSampleCSV} variant="tertiary" size="S">
                  Descargar Ejemplo
                </Button>
              </Flex>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                ref={fileInputRef}
              />
              <Box>
                <Flex gap={1} alignItems="center">
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    Buscar:
                  </Typography>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nombre o teléfono"
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      fontSize: "0.75rem",
                      width: "120px",
                    }}
                  />
                </Flex>
              </Box>
              <Box>
                <Flex gap={1} alignItems="center">
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    Estado:
                  </Typography>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      fontSize: "0.75rem",
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="unknown">Sin responder</option>
                    <option value="yes">Confirmados</option>
                    <option value="no">Rechazados</option>
                  </select>
                </Flex>
              </Box>
              <Box>
                <Flex gap={1} alignItems="center">
                  <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                    Invitado de:
                  </Typography>
                  <select
                    value={invitedByFilter}
                    onChange={(e) => setInvitedByFilter(e.target.value)}
                    style={{
                      padding: "4px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      backgroundColor: "#fff",
                      fontSize: "0.75rem",
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="Bride">Novia</option>
                    <option value="Groom">Novio</option>
                  </select>
                </Flex>
              </Box>
              <Button
                variant="success"
                onClick={sendWhatsAppInvitations}
                disabled={
                  Object.keys(selectedGuests).filter((id) => selectedGuests[id])
                    .length === 0
                }
                size="S"
              >
                Enviar WhatsApp
              </Button>
            </Flex>
          </Flex>

          <Table
            colCount={7}
            rowCount={
              guests.filter((guest) => {
                const matchesStatus =
                  statusFilter === "all"
                    ? true
                    : guest.confirmed === statusFilter;
                const matchesInvitedBy =
                  invitedByFilter === "all"
                    ? true
                    : guest.invitedBy === invitedByFilter;
                const matchesSearch =
                  searchQuery === ""
                    ? true
                    : (guest.name &&
                        guest.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())) ||
                      (guest.phone && guest.phone.includes(searchQuery));
                return matchesStatus && matchesInvitedBy && matchesSearch;
              }).length + 1
            }
          >
            <Thead>
              <Tr>
                <Th>
                  <Checkbox
                    checked={
                      guests.length > 0 &&
                      guests.every((guest) => selectedGuests[guest.documentId])
                    }
                    onClick={handleSelectAll}
                  >
                    <VisuallyHidden>Seleccionar todos</VisuallyHidden>
                  </Checkbox>
                </Th>
                <Th>
                  <Typography variant="sigma">Nombre</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Teléfono</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Confirmación</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Invitados Máximos</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Invitados Confirmados</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Invitado Por</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {guests
                .filter((guest) => {
                  const matchesStatus =
                    statusFilter === "all"
                      ? true
                      : guest.confirmed === statusFilter;
                  const matchesInvitedBy =
                    invitedByFilter === "all"
                      ? true
                      : guest.invitedBy === invitedByFilter;
                  const matchesSearch =
                    searchQuery === ""
                      ? true
                      : (guest.name &&
                          guest.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())) ||
                        (guest.phone && guest.phone.includes(searchQuery));
                  return matchesStatus && matchesInvitedBy && matchesSearch;
                })
                .map((guest) => (
                  <Tr key={guest.documentId}>
                    <Td>
                      <Checkbox
                        checked={Boolean(selectedGuests[guest.documentId])}
                        onClick={() => handleSelectGuest(guest.documentId)}
                      >
                        <VisuallyHidden>
                          Seleccionar {guest.name}
                        </VisuallyHidden>
                      </Checkbox>
                    </Td>
                    <Td>
                      <Typography>{guest.name}</Typography>
                    </Td>
                    <Td>
                      <Typography>{guest.phone || "-"}</Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {guest.confirmed === "yes" && "Confirmado"}
                        {guest.confirmed === "no" && "Rechazado"}
                        {(guest.confirmed === "unknown" || !guest.confirmed) &&
                          "Pendiente"}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>{guest.maxGuests}</Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {guest.confirmedGuests ||
                          (guest.confirmed === "yes" ? guest.maxGuests : 0)}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>
                        {guest.invitedBy === "Groom"
                          ? "Novio"
                          : guest.invitedBy === "Bride"
                            ? "Novia"
                            : guest.invitedBy || "-"}
                      </Typography>
                    </Td>
                  </Tr>
                ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      {/* CSV Upload Results Modal */}
      {showUploadDialog && uploadResults && (
        <Portal>
          <Box
            background="neutral0"
            padding={4}
            shadow="tableShadow"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              width: "80%",
              maxWidth: "800px",
              maxHeight: "80vh",
              overflow: "auto",
              borderRadius: "4px",
            }}
          >
            <Box padding={4} style={{ borderBottom: "1px solid #eee" }}>
              <Flex justifyContent="space-between" alignItems="center">
                <Typography variant="beta">
                  Resultados de la importación
                </Typography>
                <Button variant="tertiary" onClick={closeUploadDialog}>
                  ×
                </Button>
              </Flex>
            </Box>

            <Box padding={4}>
              <Typography variant="delta" paddingBottom={2}>
                Estadísticas
              </Typography>
              <Box padding={2} background="neutral100" borderRadius="4px">
                <Flex direction="column" gap={2}>
                  <Typography>
                    Total de registros: {uploadResults.total}
                  </Typography>
                  <Typography>
                    Invitados creados: {uploadResults.created}
                  </Typography>
                  <Typography>
                    Duplicados encontrados: {uploadResults.duplicates.length}
                  </Typography>
                  <Typography>
                    Errores: {uploadResults.errors.length}
                  </Typography>
                </Flex>
              </Box>
            </Box>

            {uploadResults.duplicates.length > 0 && (
              <Box paddingBottom={4}>
                <Typography variant="delta" paddingBottom={2}>
                  Duplicados
                </Typography>
                <Box
                  padding={2}
                  background="neutral100"
                  borderRadius="4px"
                  style={{ maxHeight: "200px", overflow: "auto" }}
                >
                  {uploadResults.duplicates.map((duplicate, index) => (
                    <Box
                      key={index}
                      padding={2}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <Typography fontWeight="bold">
                        {duplicate.row.name}
                      </Typography>
                      <Typography variant="pi">
                        Teléfono: {duplicate.row.phone} - Ya existe con ID:{" "}
                        {duplicate.existing.id}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {uploadResults.errors.length > 0 && (
              <Box paddingBottom={4}>
                <Typography variant="delta" paddingBottom={2}>
                  Errores
                </Typography>
                <Box
                  padding={2}
                  background="neutral100"
                  borderRadius="4px"
                  style={{ maxHeight: "200px", overflow: "auto" }}
                >
                  {uploadResults.errors.map((error, index) => (
                    <Box
                      key={index}
                      padding={2}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <Typography fontWeight="bold">
                        {error.row.name || `Fila ${index + 1}`}
                      </Typography>
                      <Typography variant="pi" textColor="danger600">
                        Error: {error.error}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Flex justifyContent="flex-end">
              <Button onClick={closeUploadDialog}>Cerrar</Button>
            </Flex>
          </Box>
          <Box
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999,
            }}
            onClick={closeUploadDialog}
          />
        </Portal>
      )}
    </>
  );
};

export default GuestDashboard;
