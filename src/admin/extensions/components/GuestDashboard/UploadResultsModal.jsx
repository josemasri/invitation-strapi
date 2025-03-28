import React from "react";
import { Box, Typography, Flex, Button, Portal } from "@strapi/design-system";

const UploadResultsModal = ({ uploadResults, closeUploadDialog }) => {
  if (!uploadResults) return null;

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
  );
};

export default UploadResultsModal;