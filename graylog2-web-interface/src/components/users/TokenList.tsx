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
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  ClipboardButton,
  ControlledTableList,
  Icon,
  RelativeTime,
  SearchForm,
  Spinner,
  IfPermitted,
} from 'components/common';
import { Button, Col, Panel, Row } from 'components/bootstrap';
import type { Token, TokenSummary } from 'stores/users/UsersStore';
import { sortByDate } from 'util/SortUtils';
import { Headline } from 'components/common/Section/SectionComponent';

import CreateTokenForm from './CreateTokenForm';

const StyledTokenPanel = styled(Panel)`
  &.panel {
    margin: 10px 0;
    background-color: ${(props) => props.theme.colors.global.contentBackground};

    .panel-heading {
      color: ${(props) => props.theme.colors.gray[30]};
    }
  }
`;

const StyledCopyTokenButton = styled(ClipboardButton)`
  vertical-align: baseline;
  margin-left: 1em;
`;

const StyledSearchForm = styled(SearchForm)`
  margin-bottom: 10px;
`;

const StyledLastAccess = styled.div`
  color: ${(props) => props.theme.colors.gray[60]};
  font-size: ${(props) => props.theme.fonts.size.small};
  margin-bottom: 5px;
`;

type Props = {
  creatingToken?: boolean;
  deletingToken?: string;
  onCreate: ({ tokenName, tokenTtl }: { tokenName: string; tokenTtl: string }) => Promise<Token>;
  onDelete: (tokenId: string, tokenName: string) => void;
  tokens?: TokenSummary[];
};

const TokenList = ({ creatingToken = false, deletingToken = null, onCreate, onDelete, tokens = [] }: Props) => {
  const [createdToken, setCreatedToken] = useState<Token | undefined>();
  const [query, setQuery] = useState('');

  const effectiveTokens = useMemo(() => {
    const queryRegex = new RegExp(query, 'i');

    return tokens
      .filter(({ name }) => queryRegex.test(name))
      .sort((token1, token2) => sortByDate(token1.last_access, token2.last_access, 'desc'));
  }, [query, tokens]);

  const handleTokenCreation = ({ tokenName, tokenTtl }) => {
    const promise = onCreate({ tokenName, tokenTtl });

    promise.then((token) => {
      setCreatedToken(token);

      return token;
    });
  };

  const deleteToken = (token: TokenSummary) => () => {
    onDelete(token.id, token.name);
  };

  const updateQuery = (nextQuery?: string) => setQuery(nextQuery || '');

  return (
    <span>
      <IfPermitted permissions="users:tokencreate">
        <Headline>Create And Edit Tokens</Headline>
        <CreateTokenForm onCreate={handleTokenCreation} creatingToken={creatingToken} />
      </IfPermitted>
      {createdToken && (
        <StyledTokenPanel bsStyle="success">
          <Panel.Heading>
            <Panel.Title>
              Token <em>{createdToken.name}</em> created!
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <p>This is your new token. Make sure to copy it now, you will not be able to see it again.</p>
            <pre>
              {createdToken.token}
              <StyledCopyTokenButton title={<Icon name="content_copy" />} text={createdToken.token} bsSize="xsmall" />
            </pre>
            <Button bsStyle="primary" onClick={() => setCreatedToken(undefined)}>
              Done
            </Button>
          </Panel.Body>
        </StyledTokenPanel>
      )}
      <hr />
      <StyledSearchForm onSearch={updateQuery} onReset={updateQuery} label="Filter" useLoadingState={false} />

      <ControlledTableList>
        <ControlledTableList.Header />
        {effectiveTokens.length === 0 && (
          <ControlledTableList.Item>
            <p>{query === '' ? 'No tokens to display.' : 'No tokens match the filter.'}</p>
          </ControlledTableList.Item>
        )}
        {effectiveTokens.map((token) => {
          const tokenNeverUsed = Date.parse(token.last_access) === 0;

          return (
            <ControlledTableList.Item key={token.id}>
              <Row className="row-sm">
                <Col md={9}>
                  {token.name}
                  <StyledLastAccess>
                    {tokenNeverUsed ? (
                      'Never used'
                    ) : (
                      <>
                        Last used <RelativeTime dateTime={token.last_access} />
                      </>
                    )}
                  </StyledLastAccess>
                </Col>
                <Col md={3} className="text-right">
                  <Button
                    bsSize="xsmall"
                    disabled={deletingToken === token.id}
                    bsStyle="danger"
                    onClick={deleteToken(token)}>
                    {deletingToken === token.id ? <Spinner text="Deleting..." /> : 'Delete'}
                  </Button>
                </Col>
              </Row>
            </ControlledTableList.Item>
          );
        })}
      </ControlledTableList>
    </span>
  );
};

export default TokenList;
