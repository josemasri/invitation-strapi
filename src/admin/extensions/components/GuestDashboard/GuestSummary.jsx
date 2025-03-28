import React from "react";
import { Box, Typography, Flex } from "@strapi/design-system";
import { ChartPie } from '@strapi/icons';
import StatCard from "./StatCard";
import CollapsibleSection from "./CollapsibleSection";

const GuestSummary = ({ guestData }) => {
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

  return (
    <CollapsibleSection
      title="Resumen y Distribución"
      icon={<ChartPie aria-hidden />}
    >
      <Flex gap={2} wrap="wrap">
        {/* En pantallas grandes: 5 tarjetas en una fila */}
        {/* En pantallas medianas: 2 tarjetas por fila */}
        {/* En pantallas pequeñas: 1 tarjeta por fila */}
        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)",
            large: "calc(20% - 8px)"
          }}
          marginBottom={2}
        >
          <StatCard
            title="Total Invitaciones"
            value={guestData.total}
            description="Total enviadas"
          />
        </Box>

        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)",
            large: "calc(20% - 8px)"
          }}
          marginBottom={2}
        >
          <StatCard
            title="Asistencia"
            value={`${guestData.confirmedGuests}/${guestData.maxGuests}`}
            description={`${attendancePercentage}% esperada`}
            color="success600"
          />
        </Box>

        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)",
            large: "calc(20% - 8px)"
          }}
          marginBottom={2}
        >
          <StatCard
            title="Confirmados"
            value={`${guestData.confirmed} (${confirmedPercentage}%)`}
            description="Han confirmado"
            color="success600"
          />
        </Box>

        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)",
            large: "calc(20% - 8px)"
          }}
          marginBottom={2}
        >
          <StatCard
            title="Rechazados"
            value={`${guestData.declined} (${declinedPercentage}%)`}
            description="Han declinado"
            color="danger600"
          />
        </Box>

        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)",
            large: "calc(20% - 8px)"
          }}
          marginBottom={2}
        >
          <StatCard
            title="Pendientes"
            value={`${guestData.unknown} (${unknownPercentage}%)`}
            description="Sin responder"
            color="warning600"
          />
        </Box>
      </Flex>
    </CollapsibleSection>
  );
};

export default GuestSummary;