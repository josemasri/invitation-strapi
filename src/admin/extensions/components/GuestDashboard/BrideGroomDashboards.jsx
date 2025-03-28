import React, { useState } from "react";
import { Box, Typography, Flex, Card } from "@strapi/design-system";
import { User, Pencil, ChartBubble } from '@strapi/icons';
import StatCard from "./StatCard";
import CollapsibleSection from "./CollapsibleSection";

const BrideGroomDashboards = ({ guestData }) => {
  const [showBrideDashboard, setShowBrideDashboard] = useState(true);
  const [showGroomDashboard, setShowGroomDashboard] = useState(true);

  return (
    <CollapsibleSection
      title="Dashboard de Invitados por Novia y Novio"
      icon={<User aria-hidden />}
    >
      <Flex gap={2} wrap="wrap">
        {/* Dashboard de la Novia */}
        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)"
          }}
          marginBottom={2}
        >
          <Card padding={3}>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              paddingBottom={2}
              style={{ cursor: "pointer" }}
              onClick={() => setShowBrideDashboard(!showBrideDashboard)}
            >
              <Flex alignItems="center" gap={2}>
                <Pencil aria-hidden color="#4945ff" />
                <Typography variant="delta" fontWeight="bold" textColor="primary600">
                  Dashboard de la Novia
                </Typography>
              </Flex>
              <Typography variant="pi" textColor="primary600">
                {showBrideDashboard ? "▼" : "►"}
              </Typography>
            </Flex>
            
            {showBrideDashboard && (
              <>
                <Flex gap={2} wrap="wrap">
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
                    <StatCard
                      title="Total Invitados"
                      value={guestData.invitedByBride}
                      description={`${Math.round((guestData.invitedByBride / guestData.total) * 100)}% del total`}
                      color="primary600"
                    />
                  </Box>
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
                    <StatCard
                      title="Confirmados"
                      value={guestData.confirmedByBride}
                      description={`${guestData.invitedByBride > 0 ? Math.round((guestData.confirmedByBride / guestData.invitedByBride) * 100) : 0}% de tasa de confirmación`}
                      color="primary600"
                    />
                  </Box>
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
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
              </>
            )}
          </Card>
        </Box>

        {/* Dashboard del Novio */}
        <Box
          width={{
            small: "100%",
            medium: "calc(50% - 8px)"
          }}
          marginBottom={2}
        >
          <Card padding={3}>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              paddingBottom={2}
              style={{ cursor: "pointer" }}
              onClick={() => setShowGroomDashboard(!showGroomDashboard)}
            >
              <Flex alignItems="center" gap={2}>
                <ChartBubble aria-hidden color="#9736e8" />
                <Typography variant="delta" fontWeight="bold" textColor="secondary600">
                  Dashboard del Novio
                </Typography>
              </Flex>
              <Typography variant="pi" textColor="secondary600">
                {showGroomDashboard ? "▼" : "►"}
              </Typography>
            </Flex>
            
            {showGroomDashboard && (
              <>
                <Flex gap={2} wrap="wrap">
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
                    <StatCard
                      title="Total Invitados"
                      value={guestData.invitedByGroom}
                      description={`${Math.round((guestData.invitedByGroom / guestData.total) * 100)}% del total`}
                      color="secondary600"
                    />
                  </Box>
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
                    <StatCard
                      title="Confirmados"
                      value={guestData.confirmedByGroom}
                      description={`${guestData.invitedByGroom > 0 ? Math.round((guestData.confirmedByGroom / guestData.invitedByGroom) * 100) : 0}% de tasa de confirmación`}
                      color="secondary600"
                    />
                  </Box>
                  <Box
                    width={{
                      small: "100%",
                      medium: "calc(33% - 4px)"
                    }}
                    marginBottom={2}
                  >
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
              </>
            )}
          </Card>
        </Box>
      </Flex>
    </CollapsibleSection>
  );
};

export default BrideGroomDashboards;