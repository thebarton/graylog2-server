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
module.exports = {
  customSyntax: 'postcss-styled-syntax',
  extends: [
    'stylelint-config-standard',
  ],
  rules: {
    'declaration-empty-line-before': null,
    'function-name-case': null,
    'media-query-no-invalid': null,
    'no-descending-specificity': null,
    'no-empty-source': null,
    'property-no-vendor-prefix': [true, {
      ignoreProperties: ['grid-rows', 'grid-columns', 'grid-row', 'grid-column'],
    }],
    'selector-class-pattern': null,
    'value-no-vendor-prefix': [true, {
      ignoreValues: ['grid', 'inline-grid'],
    }],
    'value-keyword-case': null,
  },
};
