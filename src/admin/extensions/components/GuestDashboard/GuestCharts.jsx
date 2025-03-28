import React from 'react';
import { Box, Typography, Card, Flex } from '@strapi/design-system';

// Componente para una barra visual simple
const ProgressBar = ({ value, maxValue, color, label }) => {
  const percentage = Math.round((value / maxValue) * 100);
  
  return (
    <Box marginBottom={2}>
      <Flex justifyContent="space-between" marginBottom={1}>
        <Typography variant="pi">{label}</Typography>
        <Typography variant="pi">{value} / {maxValue} ({percentage}%)</Typography>
      </Flex>
      <Box background="neutral200" height="12px" borderRadius="4px" overflow="hidden">
        <Box
          background={color}
          height="100%"
          width={`${percentage}%`}
          style={{ transition: 'width 0.5s ease' }}
        />
      </Box>
    </Box>
  );
};

// Componente para un gráfico de barras simple
const SimpleBarChart = ({ data, colors, title }) => {
  const maxValue = Math.max(...Object.values(data));
  
  return (
    <Card padding={4}>
      <Typography variant="delta" marginBottom={3}>{title}</Typography>
      {Object.entries(data).map(([key, value], index) => (
        <ProgressBar
          key={key}
          label={key}
          value={value}
          maxValue={maxValue}
          color={colors[index]}
        />
      ))}
    </Card>
  );
};

const GuestCharts = ({ data }) => {
  const { confirmed, declined, unknown, confirmedGuests, maxGuests } = data;
  
  // Datos para el gráfico de confirmación
  const confirmationData = {
    'Confirmados': confirmed,
    'Rechazados': declined,
    'Pendientes': unknown
  };
  
  // Colores para los gráficos
  const confirmationColors = ['#4caf50', '#f44336', '#ff9800'];
  
  return (
    <Box>
      <Typography variant="beta" fontWeight="bold">
        Gráficos de Invitados
      </Typography>
      
      <Box paddingTop={4}>
        <Flex gap={4} wrap="wrap">
          <Box width="45%" marginBottom={4}>
            <SimpleBarChart
              data={confirmationData}
              colors={confirmationColors}
              title="Estado de Confirmación"
            />
          </Box>
          
          <Box width="45%" marginBottom={4}>
            <Card padding={4}>
              <Typography variant="delta" marginBottom={3}>Asistencia Confirmada</Typography>
              <ProgressBar
                label="Asistencia"
                value={confirmedGuests}
                maxValue={maxGuests}
                color="#4caf50"
              />
            </Card>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default GuestCharts;