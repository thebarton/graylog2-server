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
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { DocumentTitle, PageHeader } from 'components/common';
import DocsHelper from 'util/DocsHelper';
import Routes from 'routing/Routes';
import { Col, Row } from 'components/bootstrap';
import CreateProfile from 'components/indices/IndexSetFieldTypeProfiles/CreateProfile';
import useHasTypeMappingPermission from 'hooks/useHasTypeMappingPermission';
import { IndicesPageNavigation } from 'components/indices';

const IndexSetFieldTypeProfileCreatePage = () => {
  const navigate = useNavigate();
  const hasMappingPermission = useHasTypeMappingPermission();

  useEffect(() => {
    if (!hasMappingPermission) {
      navigate(Routes.NOTFOUND);
    }
  }, [hasMappingPermission, navigate]);

  return (
    <DocumentTitle title="Create Index Set Field Type Profile">
      <IndicesPageNavigation />
      <PageHeader
        title="Create Index Set Field Type Profile"
        documentationLink={{
          title: 'Index model documentation',
          path: DocsHelper.PAGES.INDEX_MODEL,
        }}>
        <span>
          With index set field type profiles you can bundle up custom field types into profiles. Then you can assign
          this profile to any index set. On this page you can create a new profile.
        </span>
      </PageHeader>
      <Row className="content">
        <Col md={12}>
          <CreateProfile />
        </Col>
      </Row>
    </DocumentTitle>
  );
};

export default IndexSetFieldTypeProfileCreatePage;
