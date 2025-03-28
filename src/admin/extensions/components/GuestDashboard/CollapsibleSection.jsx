import React, { useState } from "react";
import { Box, Typography, Flex, Button } from "@strapi/design-system";
import { CaretDown, CaretUp } from '@strapi/icons';

const CollapsibleSection = ({ title, children, defaultExpanded = true, icon = null }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box paddingBottom={3}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        paddingBottom={2}
        style={{ cursor: "pointer" }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Flex alignItems="center" gap={2}>
          {icon && <Box paddingRight={1}>{icon}</Box>}
          <Typography variant="epsilon" fontWeight="bold">
            {title}
          </Typography>
        </Flex>
        <Button
          variant="tertiary"
          size="S"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? <CaretUp aria-hidden /> : <CaretDown aria-hidden />}
        </Button>
      </Flex>
      
      {isExpanded && children}
    </Box>
  );
};

export default CollapsibleSection;