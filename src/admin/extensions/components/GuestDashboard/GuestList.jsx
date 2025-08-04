import React from "react";
import {
  Box,
  Typography,
  Flex,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  Checkbox,
  VisuallyHidden,
  Card,
} from "@strapi/design-system";
import { List, Plus, Pencil, Trash, Message, Bell } from '@strapi/icons';
import CollapsibleSection from "./CollapsibleSection";

const GuestList = ({
  guests,
  selectedGuests,
  handleSelectGuest,
  handleSelectAll,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  invitedByFilter,
  setInvitedByFilter,
  triggerFileUpload,
  isUploading,
  downloadSampleCSV,
  sendWhatsAppInvitations,
  sendWhatsAppReminders,
  fileInputRef,
  handleFileUpload,
  onAddGuest,
  onEditGuest,
  onDeleteGuest,
}) => {
  return (
    <CollapsibleSection
      title="Lista de Invitados"
      defaultExpanded={true}
      icon={<List aria-hidden />}
    >
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        paddingBottom={2}
        wrap="wrap"
      >
        <Flex alignItems="center" gap={2} marginBottom={{ small: 2, medium: 0 }}>
          <Button
            onClick={onAddGuest}
            size="S"
            variant="success"
            startIcon={<Plus aria-hidden />}
          >
            Agregar Invitado
          </Button>
        </Flex>
        <Flex
          gap={2}
          alignItems="center"
          wrap="wrap"
          style={{ maxWidth: "100%" }}
        >
          {/* Fila 1: Importar/Exportar CSV */}
          <Box width={{ small: "100%", medium: "auto" }} marginBottom={{ small: 2, medium: 0 }}>
            <Flex gap={1} wrap="wrap">
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
          </Box>
          
          {/* Fila 2: Filtros */}
          <Flex gap={2} wrap="wrap" width="100%" marginTop={{ small: 2, medium: 0 }}>
            <Box marginRight={2} marginBottom={1}>
              <Flex gap={1} alignItems="center">
                <Typography variant="pi" style={{ fontSize: "0.75rem" }}>
                  Buscar:
                </Typography>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre, invitación o teléfono"
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
            <Box marginRight={2} marginBottom={1}>
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
            <Box marginRight={2} marginBottom={1}>
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
            <Box marginRight={2}>
              <Button
                variant="success"
                onClick={sendWhatsAppInvitations}
                disabled={
                  Object.keys(selectedGuests).filter((id) => selectedGuests[id])
                    .length === 0
                }
                size="S"
                startIcon={<Message aria-hidden />}
              >
                Enviar Invitación
              </Button>
            </Box>
            <Box>
              <Button
                variant="secondary"
                onClick={sendWhatsAppReminders}
                disabled={
                  Object.keys(selectedGuests).filter((id) => selectedGuests[id])
                    .length === 0
                }
                size="S"
                startIcon={<Bell aria-hidden />}
              >
                Enviar Recordatorio
              </Button>
            </Box>
          </Flex>
        </Flex>
      </Flex>

      {/* Contenedor con scroll horizontal para pantallas pequeñas */}
      <Box style={{ overflowX: "auto" }}>
        <Table
          colCount={10} /* Actualizado para incluir la columna de nombre en invitación */
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
                    (guest.invitationName &&
                      guest.invitationName
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
              <Typography variant="sigma">Nombre en Invitación</Typography>
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
            <Th>
              <Flex alignItems="center" gap={2}>
                <Message aria-hidden width="12px" height="12px" />
                <Typography variant="sigma">Mensajes Enviados</Typography>
              </Flex>
            </Th>
            <Th>
              <Typography variant="sigma">Acciones</Typography>
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
                    (guest.invitationName &&
                      guest.invitationName
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
                  <Typography>{guest.invitationName || guest.name}</Typography>
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
                <Td>
                  <Flex alignItems="center" gap={2}>
                    {guest.timesSended > 0 && (
                      <Message
                        aria-hidden
                        color={guest.timesSended > 1 ? "#4945ff" : "#32324d"}
                        width="12px"
                        height="12px"
                      />
                    )}
                    <Typography
                      fontWeight={guest.timesSended > 0 ? "bold" : "normal"}
                      textColor={guest.timesSended > 1 ? "primary600" : "neutral800"}
                    >
                      {guest.timesSended || 0}
                    </Typography>
                  </Flex>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <Button
                      onClick={() => onEditGuest(guest)}
                      size="S"
                      variant="secondary"
                      startIcon={<Pencil aria-hidden />}
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => onDeleteGuest(guest.documentId)}
                      size="S"
                      variant="danger-light"
                      startIcon={<Trash aria-hidden />}
                    >
                      Eliminar
                    </Button>
                  </Flex>
                </Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
      </Box>
    </CollapsibleSection>
  );
};

export default GuestList;