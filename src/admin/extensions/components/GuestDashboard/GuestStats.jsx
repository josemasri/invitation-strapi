import React from 'react';
import { Box, Typography, Card, Flex } from '@strapi/design-system';

const StatCard = ({ title, value, description = '', color = 'neutral800' }) => {
  return (
    <Card padding={4} style={{ height: '100%', width: '100%' }}>
      <Flex direction="column" alignItems="center" gap={2}>
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

const GuestStats = ({ data }) => {
  const { total, confirmed, declined, unknown, confirmedGuests, maxGuests } = data;
  
  // Calculate percentages
  const confirmedPercentage = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const declinedPercentage = total > 0 ? Math.round((declined / total) * 100) : 0;
  const unknownPercentage = total > 0 ? Math.round((unknown / total) * 100) : 0;
  
  // Calculate attendance percentage
  const attendancePercentage = maxGuests > 0
    ? Math.round((confirmedGuests / maxGuests) * 100)
    : 0;

  return (
    <Box>
      <Typography variant="beta" fontWeight="bold">
        Estadísticas de Invitados
      </Typography>
      
      <Box paddingTop={4}>
        <Flex gap={4} wrap="wrap">
          <Box width="45%" marginBottom={4}>
            <StatCard
              title="Total de Invitados"
              value={total}
              description="Número total de invitaciones"
            />
          </Box>
          
          <Box width="45%" marginBottom={4}>
            <StatCard
              title="Asistencia Confirmada"
              value={`${confirmedGuests} / ${maxGuests}`}
              description={`${attendancePercentage}% de asistencia esperada`}
              color="success600"
            />
          </Box>
          
          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Confirmados"
              value={`${confirmed} (${confirmedPercentage}%)`}
              color="success600"
            />
          </Box>
          
          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Rechazados"
              value={`${declined} (${declinedPercentage}%)`}
              color="danger600"
            />
          </Box>
          
          <Box width="30%" marginBottom={4}>
            <StatCard
              title="Pendientes"
              value={`${unknown} (${unknownPercentage}%)`}
              color="warning600"
            />
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default GuestStats;