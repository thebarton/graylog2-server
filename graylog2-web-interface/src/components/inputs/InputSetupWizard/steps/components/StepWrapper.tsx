/*
 * Copyright (C) 2020 Graylog, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Server Side Public License, version 1,
 * as published by MongoDB, Inc.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * Server Side Public License for more details.
 *
 * You should have received a copy of the Server Side Public License
 * along with this program. If not, see
 * <http://www.mongodb.com/licensing/server-side-public-license>.
 */
import * as React from 'react';
import styled, { css } from 'styled-components';

import { Row, Col } from 'components/bootstrap';
import { Tooltip } from 'components/common';

export const DescriptionCol = styled(Col)(
  ({ theme }) => css`
    margin-bottom: ${theme.spacings.md};
  `,
);

export const ButtonCol = styled(Col)(
  ({ theme }) => css`
    display: flex;
    justify-content: flex-end;
    gap: ${theme.spacings.xs};
    margin-top: ${theme.spacings.lg};
  `,
);

export const StyledHeading = styled.h3(
  ({ theme }) => css`
    margin-bottom: ${theme.spacings.sm};
  `,
);

export const StyledList = styled.ul`
  list-style-type: disc;
  padding-left: 20px;
`;

const StepCol = styled(Col)(
  ({ theme }) => css`
    padding-left: ${theme.spacings.lg};
    padding-right: ${theme.spacings.lg};
    padding-top: ${theme.spacings.sm};
  `,
);

export const RecommendedTooltip = styled(Tooltip)(
  ({ theme }) => css`
    &.mantine-Tooltip-tooltip {
      background-color: ${theme.colors.global.background}!important;
      font-size: ${theme.fonts.size.small}!important;
    }
  `,
);

export const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <Row>
    <StepCol md={12}>{children}</StepCol>
  </Row>
);
