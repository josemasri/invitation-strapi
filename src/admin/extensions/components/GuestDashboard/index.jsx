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
} from "@strapi/design-system";
import { useFetchClient, useAuth } from "@strapi/strapi/admin";
import axios from "axios";
// We'll use a simple alert instead of the notification system

const StatCard = ({ title, value, description, color = "neutral800" }) => {
  return (
    <Card padding={4} style={{ height: "100%" }}>
      <Flex direction="column" alignItems="flex-start" gap={3}>
        <Typography variant="delta" textColor={color}>
          {title}
        </Typography>
        <Typography variant="alpha" fontWeight="bold" textColor={color}>
          {value}
        </Typography>
        {description && (
          <Typography variant="epsilon" textColor="neutral600">
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
  });
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

      setGuestData({
        total,
        confirmed,
        declined,
        unknown,
        confirmedGuests,
        maxGuests,
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
    const allSelected = guests.every((guest) => selectedGuests[guest.id]);

    if (allSelected) {
      // If all are selected, unselect all
      setSelectedGuests({});
    } else {
      // Otherwise, select all
      const newSelected = {};
      guests.forEach((guest) => {
        newSelected[guest.id] = true;
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
          method: 'GET',
          url: `${whatsappApiUrl}/qr/image?t=${timestamp}`,
          responseType: 'blob',
          headers: {
            'Referrer-Policy': 'no-referrer',
            'Origin': window.location.origin,
            'mode': 'cors',
            'Authorization': `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, '')}`
          }
        });
        
        // Create a blob URL from the response
        const blob = new Blob([response.data], { type: 'image/png' });
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
            setWhatsappError("No se pudo cargar el código QR. Intente refrescar la página.");
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
        method: 'POST',
        url: `${whatsappApiUrl}/sendInvitationsToSpecificGuests`,
        data: {
          documentIds: selectedGuestIds,
        },
        headers: {
          'Content-Type': 'application/json',
          'Referrer-Policy': 'no-referrer',
          'Origin': window.location.origin,
          'mode': 'cors',
          'Authorization': `Bearer ${sessionStorage.getItem("jwtToken")?.replace(/^"|"$/g, '')}`
        },
        timeout: 10000 // 10 second timeout
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
    <Box padding={8} background="neutral100">
      <Flex
        justifyContent="space-between"
        alignItems="center"
        paddingBottom={4}
      >
        <Typography variant="alpha">Dashboard de Invitados</Typography>
        <Button onClick={fetchGuestData}>Refrescar datos</Button>
      </Flex>

      <Typography variant="epsilon" paddingBottom={6}>
        Este dashboard muestra estadísticas y gráficos sobre los invitados a la
        boda.
      </Typography>

      <Box paddingBottom={6}>
        <Typography variant="beta" paddingBottom={4}>
          Resumen
        </Typography>

        <Flex gap={4} wrap="wrap">
          <Box width="45%" marginBottom={4}>
            <StatCard
              title="Total de Invitaciones"
              value={guestData.total}
              description="Número total de invitaciones enviadas"
            />
          </Box>

          <Box width="45%" marginBottom={4}>
            <StatCard
              title="Asistencia Confirmada"
              value={`${guestData.confirmedGuests} / ${guestData.maxGuests}`}
              description={`${attendancePercentage}% de asistencia esperada`}
              color="success600"
            />
          </Box>
        </Flex>
      </Box>

      <Box paddingBottom={6}>
        <Typography variant="beta" paddingBottom={4}>
          Estado de Confirmaciones
        </Typography>

        <Flex gap={4} wrap="wrap">
          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Confirmados"
              value={`${guestData.confirmed} (${confirmedPercentage}%)`}
              description="Invitados que han confirmado su asistencia"
              color="success600"
            />
          </Box>

          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Rechazados"
              value={`${guestData.declined} (${declinedPercentage}%)`}
              description="Invitados que han declinado la invitación"
              color="danger600"
            />
          </Box>

          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Pendientes"
              value={`${guestData.unknown} (${unknownPercentage}%)`}
              description="Invitados que aún no han respondido"
              color="warning600"
            />
          </Box>
        </Flex>
      </Box>

      <Box paddingBottom={6}>
        <Typography variant="beta" paddingBottom={4}>
          Progreso de Confirmaciones
        </Typography>

        <Card padding={4}>
          <Box paddingBottom={4}>
            <Flex justifyContent="space-between" paddingBottom={2}>
              <Typography variant="pi" fontWeight="bold">
                Confirmados
              </Typography>
              <Typography variant="pi">{confirmedPercentage}%</Typography>
            </Flex>
            <Box
              background="neutral200"
              height="12px"
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

          <Box paddingBottom={4}>
            <Flex justifyContent="space-between" paddingBottom={2}>
              <Typography variant="pi" fontWeight="bold">
                Rechazados
              </Typography>
              <Typography variant="pi">{declinedPercentage}%</Typography>
            </Flex>
            <Box
              background="neutral200"
              height="12px"
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

          <Box>
            <Flex justifyContent="space-between" paddingBottom={2}>
              <Typography variant="pi" fontWeight="bold">
                Pendientes
              </Typography>
              <Typography variant="pi">{unknownPercentage}%</Typography>
            </Flex>
            <Box
              background="neutral200"
              height="12px"
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
        </Card>
      </Box>

      <Box paddingBottom={6}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          paddingBottom={4}
        >
          <Typography variant="beta">Lista de Invitados</Typography>
          <Button
            variant="success"
            onClick={sendWhatsAppInvitations}
            disabled={
              Object.keys(selectedGuests).filter((id) => selectedGuests[id])
                .length === 0
            }
          >
            Enviar Invitación por WhatsApp
          </Button>
        </Flex>

        <Table colCount={7} rowCount={guests.length + 1}>
          <Thead>
            <Tr>
              <Th>
                <Checkbox
                  checked={
                    guests.length > 0 &&
                    guests.every((guest) => selectedGuests[guest.id])
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
                <Typography variant="sigma">Email</Typography>
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
            </Tr>
          </Thead>
          <Tbody>
            {guests.map((guest) => (
              <Tr key={guest.id}>
                <Td>
                  <Checkbox
                    checked={Boolean(selectedGuests[guest.id])}
                    onClick={() => handleSelectGuest(guest.id)}
                  >
                    <VisuallyHidden>Seleccionar {guest.name}</VisuallyHidden>
                  </Checkbox>
                </Td>
                <Td>
                  <Typography>{guest.name}</Typography>
                </Td>
                <Td>
                  <Typography>{guest.phone || "-"}</Typography>
                </Td>
                <Td>
                  <Typography>{guest.email || "-"}</Typography>
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
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default GuestDashboard;
