import React from "react";
import { Box, Typography, Flex, Card } from "@strapi/design-system";
import { Check } from '@strapi/icons';
import CollapsibleSection from "./CollapsibleSection";

const ConfirmationProgress = ({ confirmedPercentage, declinedPercentage, unknownPercentage }) => {
  return (
    <CollapsibleSection
      title="Progreso de Confirmaciones"
      icon={<Check aria-hidden />}
    >
      <Card padding={2}>
        <Flex gap={2} wrap="wrap">
          <Box
            width={{
              small: "100%",
              medium: "calc(33.33% - 8px)"
            }}
            marginBottom={2}
          >
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

          <Box
            width={{
              small: "100%",
              medium: "calc(33.33% - 8px)"
            }}
            marginBottom={2}
          >
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

          <Box
            width={{
              small: "100%",
              medium: "calc(33.33% - 8px)"
            }}
            marginBottom={2}
          >
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
    </CollapsibleSection>
  );
};

export default ConfirmationProgress;