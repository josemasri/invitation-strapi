import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Flex,
  Button,
  Portal,
} from "@strapi/design-system";
import { Plus, Pencil, Cross } from '@strapi/icons';

const GuestFormModal = ({
  isVisible,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting,
}) => {
  const isEditMode = !!initialData;
  const [formData, setFormData] = useState({
    name: "",
    invitationName: "",
    phone: "",
    maxGuests: 1,
    confirmedGuests: null,
    confirmed: "unknown",
    invitedBy: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        invitationName: initialData.invitationName || "",
        phone: initialData.phone || "",
        maxGuests: initialData.maxGuests || 1,
        confirmedGuests: initialData.confirmedGuests || null,
        confirmed: initialData.confirmed || "unknown",
        invitedBy: initialData.invitedBy || "",
      });
    } else {
      // Reset form when opening in add mode
      setFormData({
        name: "",
        invitationName: "",
        phone: "",
        maxGuests: 1,
        confirmedGuests: null,
        confirmed: "unknown",
        invitedBy: "",
      });
    }
  }, [initialData, isVisible]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, initialData?.documentId);
  };

  if (!isVisible) return null;

  return (
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
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
          borderRadius: "4px",
        }}
      >
        <Box padding={4} style={{ borderBottom: "1px solid #eee" }}>
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="beta">
              {isEditMode ? "Editar Invitado" : "Agregar Nuevo Invitado"}
            </Typography>
            <Button variant="tertiary" onClick={onClose} startIcon={<Cross aria-hidden />}>
              Cerrar
            </Button>
          </Flex>
        </Box>

        <Box padding={4}>
          <form onSubmit={handleSubmit}>
            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Nombre
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="text"
                  placeholder="Nombre del invitado"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            </Box>

            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Nombre en la Invitación
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="text"
                  placeholder="Nombre como aparecerá en la invitación (opcional)"
                  value={formData.invitationName}
                  onChange={(e) => handleChange("invitationName", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            </Box>

            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Teléfono
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="text"
                  placeholder="Número de teléfono"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            </Box>

            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Invitados Máximos
              </Typography>
              <Box paddingTop={1}>
                <input
                  type="number"
                  placeholder="Número máximo de invitados"
                  value={formData.maxGuests}
                  onChange={(e) => handleChange("maxGuests", parseInt(e.target.value) || 1)}
                  required
                  min={1}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                />
              </Box>
            </Box>

            {isEditMode && (
              <Box paddingBottom={3}>
                <Typography variant="pi" fontWeight="bold">
                  Invitados Confirmados
                </Typography>
                <Box paddingTop={1}>
                  <input
                    type="number"
                    placeholder="Número de invitados confirmados"
                    value={formData.confirmedGuests || ""}
                    onChange={(e) => handleChange("confirmedGuests", parseInt(e.target.value) || null)}
                    min={0}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  />
                </Box>
              </Box>
            )}

            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Estado de Confirmación
              </Typography>
              <Box paddingTop={1}>
                <select
                  value={formData.confirmed}
                  onChange={(e) => handleChange("confirmed", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="unknown">Pendiente</option>
                  <option value="yes">Confirmado</option>
                  <option value="no">Rechazado</option>
                </select>
              </Box>
            </Box>

            <Box paddingBottom={3}>
              <Typography variant="pi" fontWeight="bold">
                Invitado Por
              </Typography>
              <Box paddingTop={1}>
                <select
                  value={formData.invitedBy}
                  onChange={(e) => handleChange("invitedBy", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="">Seleccionar...</option>
                  <option value="Bride">Novia</option>
                  <option value="Groom">Novio</option>
                </select>
              </Box>
            </Box>

            <Flex justifyContent="flex-end" gap={2}>
              <Button variant="tertiary" onClick={onClose} startIcon={<Cross aria-hidden />}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                startIcon={isEditMode ? <Pencil aria-hidden /> : <Plus aria-hidden />}
              >
                {isSubmitting
                  ? "Guardando..."
                  : isEditMode
                  ? "Actualizar"
                  : "Agregar"}
              </Button>
            </Flex>
          </form>
        </Box>
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
        onClick={onClose}
      />
    </Portal>
  );
};

export default GuestFormModal;