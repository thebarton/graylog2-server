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
import { useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';
import upperCase from 'lodash/upperCase';

import type { ActionContexts } from 'views/types';
import Icon from 'components/common/Icon';
import { MenuItem } from 'components/bootstrap';
import WidgetFocusContext from 'views/components/contexts/WidgetFocusContext';
import type {
  ActionDefinition,
  ActionHandlerArguments,
  ExternalLinkAction,
  HandlerAction,
  SetActionComponents,
  ActionComponents,
} from 'views/components/actions/ActionHandler';
import { createHandlerFor, isExternalLinkAction } from 'views/components/actions/ActionHandler';
import HoverForHelp from 'components/common/HoverForHelp';
import useViewsDispatch from 'views/stores/useViewsDispatch';
import useSendTelemetry from 'logic/telemetry/useSendTelemetry';
import { TELEMETRY_EVENT_TYPE } from 'logic/telemetry/Constants';
import { getPathnameWithoutId } from 'util/URLUtils';
import useLocation from 'routing/useLocation';

const StyledMenuItem: typeof MenuItem = styled(MenuItem)`
  && > a {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const ExternalLinkIcon = styled(Icon)(
  ({ theme }) => `
  margin-left: ${theme.spacings.xxs};
`,
);

type Props = {
  action: ActionDefinition;
  handlerArgs: ActionHandlerArguments;
  onMenuToggle: () => void;
  overflowingComponents: ActionComponents;
  setOverflowingComponents: (components: ActionComponents) => void;
  type: 'field' | 'value';
};

const StyledHoverForHelp = styled((props) => <HoverForHelp {...props} />)`
  margin-left: 5px;
`;

const ActionTitle = ({ action, handlerArgs }: { action: ActionDefinition; handlerArgs: ActionHandlerArguments }) => {
  if (action.help) {
    const help = action.help(handlerArgs);

    if (help) {
      const { title, description } = help;

      return (
        <>
          {action.title}
          <StyledHoverForHelp title={title} testId="menu-item-help">
            {description}
          </StyledHoverForHelp>
        </>
      );
    }
  }

  return <>{action.title}</>;
};

type ExternalLinkItemProps = Pick<Props, 'handlerArgs' | 'onMenuToggle' | 'type'> & {
  action: ExternalLinkAction<ActionContexts>;
  disabled: boolean;
  field: string;
};

const ExternalLinkItem = ({ action, disabled, field, handlerArgs, onMenuToggle, type }: ExternalLinkItemProps) => {
  const { unsetWidgetFocusing } = useContext(WidgetFocusContext);

  const linkProps = {
    href: action.linkTarget(handlerArgs),
    target: '_blank',
    rel: 'noopener noreferrer',
  } as const;

  const onSelect = useCallback(() => {
    const { resetFocus = false } = action;

    if (resetFocus) {
      unsetWidgetFocusing();
    }

    onMenuToggle();
  }, [action, onMenuToggle, unsetWidgetFocusing]);

  return (
    <StyledMenuItem disabled={disabled} eventKey={{ action: type, field }} onSelect={onSelect} {...linkProps}>
      <ActionTitle action={action} handlerArgs={handlerArgs} />
      <ExternalLinkIcon name="open_in_new" />
    </StyledMenuItem>
  );
};

type ActionHandlerItemProps = Pick<
  Props,
  'handlerArgs' | 'onMenuToggle' | 'overflowingComponents' | 'setOverflowingComponents' | 'type'
> & {
  action: HandlerAction<ActionContexts>;
  disabled: boolean;
  field: string;
};

const ActionHandlerItem = ({
  disabled,
  action,
  handlerArgs,
  setOverflowingComponents,
  overflowingComponents,
  type,
  onMenuToggle,
}: ActionHandlerItemProps) => {
  const { unsetWidgetFocusing } = useContext(WidgetFocusContext);
  const dispatch = useViewsDispatch();
  const location = useLocation();
  const sendTelemetry = useSendTelemetry();

  const setActionComponents: SetActionComponents = useCallback(
    (fn) => {
      setOverflowingComponents(fn(overflowingComponents));
    },
    [overflowingComponents, setOverflowingComponents],
  );

  const handler = useMemo(
    () => createHandlerFor(dispatch, action, setActionComponents),
    [action, dispatch, setActionComponents],
  );

  const onSelect = useCallback(() => {
    const { resetFocus = false, title } = action;

    sendTelemetry(TELEMETRY_EVENT_TYPE.SEARCH_FIELD_VALUE_ACTION[upperCase(title).replace(/\s|\//g, '_')], {
      app_pathname: getPathnameWithoutId(location.pathname),
      app_section: 'search-field-value',
      event_details: {},
    });

    if (resetFocus) {
      unsetWidgetFocusing();
    }

    onMenuToggle();

    handler(handlerArgs);
  }, [action, handler, handlerArgs, location.pathname, onMenuToggle, sendTelemetry, unsetWidgetFocusing]);

  const { field } = handlerArgs;

  return (
    <StyledMenuItem disabled={disabled} eventKey={{ action: type, field }} onSelect={onSelect}>
      <ActionTitle action={action} handlerArgs={handlerArgs} />
    </StyledMenuItem>
  );
};

const ActionMenuItem = ({
  action,
  handlerArgs,
  setOverflowingComponents,
  overflowingComponents,
  type,
  onMenuToggle,
}: Props) => {
  const { isEnabled = () => true } = action;
  const dispatch = useViewsDispatch();
  const actionDisabled = dispatch((_dispatch, getState) => !isEnabled(handlerArgs, getState));
  const { field } = handlerArgs;

  if (isExternalLinkAction(action)) {
    return (
      <ExternalLinkItem
        action={action}
        disabled={actionDisabled}
        field={field}
        handlerArgs={handlerArgs}
        onMenuToggle={onMenuToggle}
        type={type}
      />
    );
  }

  return (
    <ActionHandlerItem
      action={action}
      disabled={actionDisabled}
      field={field}
      handlerArgs={handlerArgs}
      onMenuToggle={onMenuToggle}
      overflowingComponents={overflowingComponents}
      setOverflowingComponents={setOverflowingComponents}
      type={type}
    />
  );
};

export default ActionMenuItem;
