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
import React from 'react';
import * as Immutable from 'immutable';
import type { Matcher } from 'wrappedTestingLibrary';
import { render, within, screen, waitFor, fireEvent, act } from 'wrappedTestingLibrary';
import selectEvent from 'react-select-event';
import userEvent from '@testing-library/user-event';
import { applyTimeoutMultiplier } from 'jest-preset-graylog/lib/timeouts';

import Direction from 'views/logic/aggregationbuilder/Direction';
import SortConfig from 'views/logic/aggregationbuilder/SortConfig';
import FieldTypeMapping from 'views/logic/fieldtypes/FieldTypeMapping';
import AggregationWidgetConfig from 'views/logic/aggregationbuilder/AggregationWidgetConfig';
import DataTable from 'views/components/datatable';
import FieldType from 'views/logic/fieldtypes/FieldType';
import Pivot from 'views/logic/aggregationbuilder/Pivot';
import DataTableVisualizationConfig from 'views/logic/aggregationbuilder/visualizations/DataTableVisualizationConfig';
import Series from 'views/logic/aggregationbuilder/Series';
import TestStoreProvider from 'views/test/TestStoreProvider';
import useViewsPlugin from 'views/test/testViewsPlugin';
import { SimpleFieldTypesContextProvider } from 'views/components/contexts/TestFieldTypesContextProvider';

import AggregationWizard from '../AggregationWizard';

jest.mock('views/hooks/useAggregationFunctions');

const extendedTimeout = applyTimeoutMultiplier(30000);

const fieldType = new FieldType('field_type', ['numeric'], []);
const fieldTypeMapping1 = new FieldTypeMapping('took_ms', fieldType);
const fieldTypeMapping2 = new FieldTypeMapping('http_method', fieldType);
const fields = [fieldTypeMapping1, fieldTypeMapping2];

const pivot0 = Pivot.createValues([fieldTypeMapping1.name]);
const pivot1 = Pivot.createValues([fieldTypeMapping2.name]);

const widgetConfig = AggregationWidgetConfig.builder()
  .visualization(DataTable.type)
  .rowPivots([pivot0, pivot1])
  .visualizationConfig(DataTableVisualizationConfig.empty())
  .build();

const selectEventConfig = { container: document.body };

const addSortElement = async () => {
  await userEvent.click(await screen.findByRole('button', { name: /add a sort/i }));
};

const findWidgetConfigFormSubmitButton = () => screen.findByRole('button', { name: /update preview/i });

const submitWidgetConfigForm = async () => {
  const applyButton = await findWidgetConfigFormSubmitButton();
  await userEvent.click(applyButton);
};

const sortByTookMsDesc = async (sortElementContainerId: Matcher, option: string = 'took_ms') => {
  const httpMethodSortContainer = await screen.findByTestId(sortElementContainerId);
  const sortFieldSelect = within(httpMethodSortContainer).getByLabelText('Select field for sorting');
  const sortDirectionSelect = within(httpMethodSortContainer).getByLabelText('Select direction for sorting');

  await act(async () => {
    await selectEvent.openMenu(sortFieldSelect);
  });

  await selectEvent.select(sortFieldSelect, option, selectEventConfig);

  await act(async () => {
    await selectEvent.openMenu(sortDirectionSelect);
  });

  await selectEvent.select(sortDirectionSelect, 'Descending', selectEventConfig);

  await within(httpMethodSortContainer).findByText('Descending');
};

const renderSUT = (props = {}) =>
  render(
    <TestStoreProvider>
      <SimpleFieldTypesContextProvider fields={fields}>
        <AggregationWizard
          onChange={() => {}}
          onCancel={() => {}}
          config={widgetConfig}
          editing
          id="widget-id"
          type="AGGREGATION"
          fields={Immutable.List([])}
          {...props}>
          <span>The Visualization</span>
        </AggregationWizard>
      </SimpleFieldTypesContextProvider>
    </TestStoreProvider>,
  );

describe('AggregationWizard', () => {
  useViewsPlugin();

  it('should display sort element form with values from config', async () => {
    const config = widgetConfig
      .toBuilder()
      .sort([new SortConfig('pivot', 'http_method', Direction.Ascending)])
      .build();

    renderSUT({ config });

    const httpMethodSortContainer = await screen.findByTestId('sort-element-0');

    expect(within(httpMethodSortContainer).getByText('http_method')).toBeInTheDocument();
    expect(within(httpMethodSortContainer).getByText('Ascending')).toBeInTheDocument();
  });

  it('should update configured sort element', async () => {
    const onChangeMock = jest.fn();
    const config = widgetConfig
      .toBuilder()
      .sort([new SortConfig('pivot', 'http_method', Direction.Ascending)])
      .build();

    renderSUT({ config, onChange: onChangeMock });

    await sortByTookMsDesc('sort-element-0');
    await submitWidgetConfigForm();

    const updatedConfig = widgetConfig
      .toBuilder()
      .sort([new SortConfig('pivot', 'took_ms', Direction.Descending)])
      .build();

    await waitFor(() => expect(onChangeMock).toHaveBeenCalledTimes(1));

    expect(onChangeMock).toHaveBeenCalledWith(updatedConfig);
  });

  it(
    'should configure new sort element',
    async () => {
      const onChangeMock = jest.fn();
      const config = widgetConfig.toBuilder().sort([]).build();

      renderSUT({ config, onChange: onChangeMock });

      await addSortElement();
      await sortByTookMsDesc('sort-element-0');
      await submitWidgetConfigForm();

      const updatedConfig = widgetConfig
        .toBuilder()
        .sort([new SortConfig('pivot', 'took_ms', Direction.Descending)])
        .build();

      await waitFor(() => expect(onChangeMock).toHaveBeenCalledTimes(1));

      expect(onChangeMock).toHaveBeenCalledWith(updatedConfig);
    },
    extendedTimeout,
  );

  it(
    'should configure another sort element',
    async () => {
      const onChangeMock = jest.fn();
      const series1 = Series.forFunction('count()');
      const series2 = Series.forFunction('max(took_ms)');
      const config = widgetConfig
        .toBuilder()
        .series([series1, series2])
        .sort([SortConfig.fromSeries(series1)])
        .build();

      renderSUT({ config, onChange: onChangeMock });

      await addSortElement();

      await sortByTookMsDesc('sort-element-1', 'max(took_ms)');
      await submitWidgetConfigForm();

      const updatedConfig = widgetConfig
        .toBuilder()
        .series([series1, series2])
        .sort([SortConfig.fromSeries(series1), SortConfig.fromSeries(series2)])
        .build();

      await waitFor(() => expect(onChangeMock).toHaveBeenCalledTimes(1));

      expect(onChangeMock).toHaveBeenCalledWith(updatedConfig);
    },
    extendedTimeout,
  );

  it(
    'should require field when creating a sort element',
    async () => {
      renderSUT();

      await addSortElement();

      const newSortContainer = await screen.findByTestId('sort-element-0');
      const applyButton = await findWidgetConfigFormSubmitButton();
      await waitFor(() => expect(within(newSortContainer).getByText('Field is required.')).toBeInTheDocument());
      await waitFor(() => expect(applyButton).toBeDisabled());
    },
    extendedTimeout,
  );

  it(
    'should require direction when creating a sort element',
    async () => {
      renderSUT();

      await addSortElement();

      const newSortContainer = await screen.findByTestId('sort-element-0');
      const applyButton = await findWidgetConfigFormSubmitButton();
      await waitFor(() => expect(within(newSortContainer).getByText('Direction is required.')).toBeInTheDocument());
      await waitFor(() => expect(applyButton).toBeDisabled());
    },
    extendedTimeout,
  );

  it(
    'should remove all sorts',
    async () => {
      const onChangeMock = jest.fn();
      const config = widgetConfig
        .toBuilder()
        .sort([new SortConfig('pivot', 'http_method', Direction.Ascending)])
        .build();

      renderSUT({ config, onChange: onChangeMock });

      const removeSortElementButton = await screen.findByRole('button', { name: 'Remove Sort' });
      await userEvent.click(removeSortElementButton);

      await submitWidgetConfigForm();

      const updatedConfig = widgetConfig.toBuilder().sort([]).build();

      await waitFor(() => expect(onChangeMock).toHaveBeenCalledTimes(1));

      expect(onChangeMock).toHaveBeenCalledWith(updatedConfig);
    },
    extendedTimeout,
  );

  it(
    'should correctly update sort of sort elements',
    async () => {
      const sort1 = new SortConfig('pivot', 'http_method', Direction.Ascending);
      const sort2 = new SortConfig('pivot', 'took_ms', Direction.Descending);

      const config = widgetConfig.toBuilder().rowPivots([pivot0, pivot1]).sort([sort1, sort2]).build();

      const onChange = jest.fn();
      renderSUT({ onChange, config });

      const sortSection = await screen.findByTestId('Sort-section');

      const firstItem = within(sortSection).getByTestId('sort-0-drag-handle');
      fireEvent.keyDown(firstItem, { key: 'Space', keyCode: 32 });
      await screen.findByText(/You have lifted an item/i);
      fireEvent.keyDown(firstItem, { key: 'ArrowDown', keyCode: 40 });
      await screen.findByText(/You have moved the item/i);
      fireEvent.keyDown(firstItem, { key: 'Space', keyCode: 32 });
      await screen.findByText(/You have dropped the item/i);

      await submitWidgetConfigForm();

      const updatedConfig = config.toBuilder().sort([sort2, sort1]).build();

      await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

      expect(onChange).toHaveBeenCalledWith(updatedConfig);
    },
    extendedTimeout,
  );
});
