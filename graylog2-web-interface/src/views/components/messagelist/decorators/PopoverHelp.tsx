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

import { Button } from 'components/bootstrap';
import Popover from 'components/common/Popover';
import DocumentationLink from 'components/support/DocumentationLink';
import DocsHelper from 'util/DocsHelper';

import DecoratorStyles from './decoratorStyles.css';

const PopoverHelp = () => (
  <Popover width={275} position="right" withArrow withinPortal>
    <Popover.Target>
      <Button bsStyle="link" className={DecoratorStyles.helpLink}>
        What are message decorators?
      </Button>
    </Popover.Target>
    <Popover.Dropdown>
      <p className="description">
        Decorators can modify messages shown in the search results on the fly. These changes are not stored, but only
        shown in the search results. Decorator config is stored <strong>per stream</strong>.
      </p>
      <p className="description">Use drag and drop to modify the order in which decorators are processed.</p>
      <p>
        Read more about message decorators in the{' '}
        <DocumentationLink page={DocsHelper.PAGES.DECORATORS} text="documentation" />.
      </p>
    </Popover.Dropdown>
  </Popover>
);

export default PopoverHelp;
