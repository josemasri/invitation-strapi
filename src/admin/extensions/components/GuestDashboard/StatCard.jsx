import React from "react";
import { Card, Flex, Typography } from "@strapi/design-system";

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

export default StatCard;