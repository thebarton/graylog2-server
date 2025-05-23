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
import { render, fireEvent, waitFor, screen } from 'wrappedTestingLibrary';
import * as Immutable from 'immutable';
import selectEvent from 'react-select-event';
import type { PluginRegistration } from 'graylog-web-plugin/plugin';

import asMock from 'helpers/mocking/AsMock';
import type { TitleType } from 'views/stores/TitleTypes';
import { exportSearchMessages, exportSearchTypeMessages } from 'util/MessagesExportUtils';
import type { ViewStateMap, ViewType } from 'views/logic/views/View';
import MessagesWidgetConfig from 'views/logic/widgets/MessagesWidgetConfig';
import type { AbsoluteTimeRange } from 'views/logic/queries/Query';
import View from 'views/logic/views/View';
import ViewState from 'views/logic/views/ViewState';
import ParameterBinding from 'views/logic/parameters/ParameterBinding';
import GlobalOverride from 'views/logic/search/GlobalOverride';
import SearchExecutionState from 'views/logic/search/SearchExecutionState';
import {
  messagesWidget,
  stateWithOneWidget,
  viewWithMultipleWidgets,
  viewWithOneWidget,
  viewWithoutWidget,
} from 'views/components/export/Fixtures';
import { createWidget } from 'views/logic/WidgetTestHelpers';
import useViewType from 'views/hooks/useViewType';
import TestStoreProvider from 'views/test/TestStoreProvider';
import useSearchExecutionState from 'views/hooks/useSearchExecutionState';
import useViewsPlugin from 'views/test/testViewsPlugin';
import { usePlugin } from 'views/test/testPlugins';
import startDownload from 'views/components/export/startDownload';
import type { QueryString } from 'views/logic/queries/types';
import TestFieldTypesContextProvider from 'views/components/contexts/TestFieldTypesContextProvider';

import type { Props as ExportModalProps } from './ExportModal';
import ExportModal from './ExportModal';

jest.mock('util/MessagesExportUtils', () => ({
  exportSearchMessages: jest.fn(() => Promise.resolve()),
  exportSearchTypeMessages: jest.fn(() => Promise.resolve()),
}));

const pluginExports: PluginRegistration = {
  exports: {
    enterpriseWidgets: [createWidget('messages')],
    'views.export.formats': [
      {
        type: 'csv',
        displayName: () => 'CSV',
        mimeType: 'text/csv',
        fileExtension: 'csv',
      },
    ],
  },
};

jest.mock('views/hooks/useSearchExecutionState');
jest.mock('views/hooks/useViewType');

jest.mock('./startDownload');

describe('ExportModal', () => {
  // Prepare expected payload

  const triggerFormSubmit = () => {
    const submitButton = screen.getByRole('button', {
      name: /start download/i,
      hidden: true,
    });

    fireEvent.click(submitButton);
  };

  const payload = {
    fields_in_order: ['level', 'http_method', 'message'],
    limit: undefined,
    execution_state: new SearchExecutionState(),
  };

  useViewsPlugin();
  usePlugin(pluginExports);

  beforeEach(() => {
    asMock(startDownload).mockImplementation(jest.requireActual('./startDownload').default);
    jest.clearAllMocks();
    asMock(useViewType).mockReturnValue(View.Type.Search);
    asMock(useSearchExecutionState).mockReturnValue(new SearchExecutionState());
  });

  type SimpleExportModalProps = {
    viewType?: ViewType;
  } & Partial<ExportModalProps>;

  const SimpleExportModal = ({
    viewType = View.Type.Search,
    closeModal = () => {},
    view = viewWithoutWidget(View.Type.Search),
    ...props
  }: SimpleExportModalProps) => (
    <TestStoreProvider>
      <TestFieldTypesContextProvider>
        <ExportModal
          view={view ?? viewWithoutWidget(viewType)}
          closeModal={closeModal}
          {...(props as ExportModalProps)}
        />
      </TestFieldTypesContextProvider>
    </TestStoreProvider>
  );

  it('should provide current execution state on export', async () => {
    const parameterBindings = Immutable.Map({ mainSource: new ParameterBinding('value', 'example.org') });
    const effectiveTimeRange: AbsoluteTimeRange = {
      type: 'absolute',
      from: '2020-01-01T12:18:17.827Z',
      to: '2020-01-01T12:23:17.827Z',
    };
    const globalQuery: QueryString = { type: 'elasticsearch', query_string: 'source:$mainSource$' };
    const globalOverride = new GlobalOverride(effectiveTimeRange, globalQuery);
    const executionState = new SearchExecutionState(parameterBindings, globalOverride);

    asMock(useSearchExecutionState).mockReturnValue(executionState);
    const expectedPayload = {
      ...payload,
      fields_in_order: ['timestamp', 'source', 'message'],
      execution_state: executionState,
    };
    render(<SimpleExportModal />);

    triggerFormSubmit();

    await waitFor(() =>
      expect(exportSearchMessages).toHaveBeenCalledWith(
        expectedPayload,
        'search-id',
        'text/csv',
        'Untitled-Search-search-result.csv',
      ),
    );
  });

  it('should show loading indicator after starting download', async () => {
    asMock(startDownload).mockImplementation(() => new Promise(() => {}));
    const { findByText, getAllByText } = render(<SimpleExportModal />);

    expect(getAllByText('Start Download')).toHaveLength(2);

    triggerFormSubmit();

    await findByText('Downloading...');
  });

  it('should be closed after finishing download', async () => {
    const closeModalStub = jest.fn();
    render(<SimpleExportModal closeModal={closeModalStub} />);

    triggerFormSubmit();

    await waitFor(() => expect(closeModalStub).toHaveBeenCalledTimes(1));
  });

  it('initial fields should not contain the message field if message list config showMessageRow is false', async () => {
    const widgetConfig = new MessagesWidgetConfig(['level', 'http_method'], false, false, [], []);
    const widgetWithoutMessageRow = messagesWidget().toBuilder().config(widgetConfig).build();
    const viewStateMap: ViewStateMap = Immutable.Map({
      'query-id-1': stateWithOneWidget(messagesWidget())
        .toBuilder()
        .widgets(Immutable.List([widgetWithoutMessageRow]))
        .build(),
    });
    const view = viewWithoutWidget(View.Type.Search).toBuilder().state(viewStateMap).build();
    render(<SimpleExportModal view={view} />);

    triggerFormSubmit();

    await waitFor(() => expect(exportSearchTypeMessages).toHaveBeenCalledTimes(1));

    expect(exportSearchTypeMessages).toHaveBeenCalledWith(
      {
        ...payload,
        fields_in_order: ['level', 'http_method'],
      },
      'search-id',
      'search-type-id-1',
      'text/csv',
      'Widget-1-search-result.csv',
    );
  });

  it('initial fields should keep order when there are more than 8 fields in widget config', async () => {
    const fieldList = [
      'timestamp',
      'source',
      'gl2_processing_timestamp',
      'streams',
      'gl2_accounted_message_size',
      'controller',
      'ingest_time',
      'gl2_receive_timestamp',
      'user_id',
    ];
    const widgetConfig = new MessagesWidgetConfig(fieldList, false, false, [], []);
    const widgetWithoutMessageRow = messagesWidget().toBuilder().config(widgetConfig).build();
    const viewStateMap: ViewStateMap = Immutable.Map({
      'query-id-1': stateWithOneWidget(messagesWidget())
        .toBuilder()
        .widgets(Immutable.List([widgetWithoutMessageRow]))
        .build(),
    });
    const view = viewWithoutWidget(View.Type.Search).toBuilder().state(viewStateMap).build();
    render(<SimpleExportModal view={view} />);

    triggerFormSubmit();

    await waitFor(() => expect(exportSearchTypeMessages).toHaveBeenCalledTimes(1));

    expect(exportSearchTypeMessages).toHaveBeenCalledWith(
      {
        ...payload,
        fields_in_order: fieldList,
      },
      'search-id',
      'search-type-id-1',
      'text/csv',
      'Widget-1-search-result.csv',
    );
  });

  describe('on search page', () => {
    const SearchExportModal = (props: Partial<ExportModalProps>) => (
      <SimpleExportModal viewType={View.Type.Search} {...props} />
    );

    it('should not show widget selection when no widget exists', () => {
      const { queryByText, getByText } = render(<SearchExportModal />);

      // should not show widget selection but settings form
      expect(getByText(/Define the fields for your file./)).not.toBeNull();
      // should not show info about selected widget
      expect(queryByText(/The following settings are based on the message table:/)).toBeNull();
      // should not allow widget selection
      expect(queryByText('Select different message table')).toBeNull();
    });

    it('should export all messages with default fields when no widget exists', async () => {
      render(<SearchExportModal />);

      triggerFormSubmit();

      await waitFor(() => expect(exportSearchMessages).toHaveBeenCalledTimes(1));

      expect(exportSearchMessages).toHaveBeenCalledWith(
        {
          ...payload,
          fields_in_order: ['timestamp', 'source', 'message'],
        },
        'search-id',
        'text/csv',
        'Untitled-Search-search-result.csv',
      );
    });

    it('preselect messages widget when only one exists', () => {
      const { queryByText, getByText } = render(<SearchExportModal view={viewWithOneWidget(View.Type.Search)} />);

      // should not show widget selection but settings form
      expect(getByText(/Define the fields for your file./)).not.toBeNull();
      // should show info about selected widget
      expect(getByText(/The following settings are based on the message table:/)).not.toBeNull();
      // should not allow widget selection
      expect(queryByText('Select different message table')).toBeNull();
    });

    it('should export messages related to preselected widget', async () => {
      render(<SearchExportModal view={viewWithOneWidget(View.Type.Search)} />);

      triggerFormSubmit();
      await waitFor(() => expect(exportSearchTypeMessages).toHaveBeenCalledTimes(1));

      expect(exportSearchTypeMessages).toHaveBeenCalledWith(
        payload,
        'search-id',
        'search-type-id-1',
        'text/csv',
        'Widget-1-search-result.csv',
      );
    });

    it('show widget selection if more than one exists', async () => {
      const { getByLabelText, getByText } = render(
        <SearchExportModal view={viewWithMultipleWidgets(View.Type.Search)} />,
      );

      const select = getByLabelText('Select message table');

      expect(getByText(/Please select a message table to adopt its fields./)).not.toBeNull();

      await selectEvent.openMenu(select);

      expect(getByText('Widget 1')).not.toBeNull();
      expect(getByText('Widget 2')).not.toBeNull();
    });

    it('preselect widget on direct export', () => {
      const { queryByText, getByText } = render(
        <SearchExportModal view={viewWithMultipleWidgets(View.Type.Search)} directExportWidgetId="widget-id-1" />,
      );

      // should not show widget selection but settings form
      expect(getByText(/Define the fields for your file./)).not.toBeNull();
      // should show info about selected widget
      expect(getByText(/The following settings are based on the message table:/)).not.toBeNull();
      // should not allow widget selection
      expect(queryByText('Select different message table')).toBeNull();
    });

    it('should export widget messages on direct export', async () => {
      render(<SearchExportModal view={viewWithMultipleWidgets(View.Type.Search)} directExportWidgetId="widget-id-1" />);

      triggerFormSubmit();
      await waitFor(() => expect(exportSearchTypeMessages).toHaveBeenCalledTimes(1));

      expect(exportSearchTypeMessages).toHaveBeenCalledWith(
        payload,
        'search-id',
        'search-type-id-1',
        'text/csv',
        'Widget-1-search-result.csv',
      );
    });
  });

  describe('on dashboard', () => {
    beforeEach(() => {
      asMock(useViewType).mockReturnValue(View.Type.Dashboard);
    });

    const DashboardExportModal = (props) => (
      <SimpleExportModal viewType={View.Type.Dashboard} view={viewWithoutWidget(View.Type.Dashboard)} {...props} />
    );

    it('show warning when no messages widget exists', () => {
      const { getByText } = render(<DashboardExportModal view={viewWithoutWidget(View.Type.Dashboard)} />);

      expect(getByText('You need to create a message table widget to export its result.')).not.toBeNull();
    });

    it('does not preselect widget when only one exists', () => {
      const { getByText } = render(<DashboardExportModal view={viewWithOneWidget(View.Type.Dashboard)} />);

      expect(getByText(/Please select the message table you want to export the search results for./)).not.toBeNull();
    });

    it('show widget selection if more than one exists', async () => {
      const { getByText, getByLabelText } = render(
        <DashboardExportModal view={viewWithMultipleWidgets(View.Type.Dashboard)} />,
      );
      const select = getByLabelText('Select message table');

      expect(getByText(/Please select the message table you want to export the search results for./)).not.toBeNull();

      await selectEvent.openMenu(select);

      expect(getByText('Widget 1')).not.toBeNull();
      expect(getByText('Widget 2')).not.toBeNull();
    });

    it('show widget selection with widgets from all dashboard pages', async () => {
      const secondViewState: ViewState = ViewState.builder()
        .widgets(Immutable.List([messagesWidget('widget-id-2')]))
        .widgetMapping(Immutable.Map({ 'widget-id-2': Immutable.Set(['search-type-id-2']) }))
        .titles(
          Immutable.Map<TitleType, Immutable.Map<string, string>>({
            widget: Immutable.Map({ 'widget-id-2': 'Widget 2' }),
          }),
        )
        .build();

      const complexView = viewWithoutWidget(View.Type.Dashboard)
        .toBuilder()
        .state(Immutable.Map({ 'query-id-1': stateWithOneWidget(messagesWidget()), 'query-id-2': secondViewState }))
        .build();

      const { getByText, getByLabelText } = render(<DashboardExportModal view={complexView} />);
      const select = getByLabelText('Select message table');

      await selectEvent.openMenu(select);

      expect(getByText('Widget 1')).not.toBeNull();
      expect(getByText('Widget 2')).not.toBeNull();
    });

    it('preselect widget on direct widget export', () => {
      const { queryByText, getByText } = render(
        <DashboardExportModal view={viewWithMultipleWidgets(View.Type.Dashboard)} directExportWidgetId="widget-id-1" />,
      );

      // should not show widget selection but settings form
      expect(getByText(/Define the fields for your file./)).not.toBeNull();
      // should show info about selected widget
      expect(getByText(/You are currently exporting the search results for the message table:/)).not.toBeNull();
      // should not allow widget selection
      expect(queryByText('Select different message table')).toBeNull();
    });

    it('should export widget messages on direct export', async () => {
      render(
        <DashboardExportModal view={viewWithMultipleWidgets(View.Type.Search)} directExportWidgetId="widget-id-1" />,
      );

      triggerFormSubmit();
      await waitFor(() => expect(exportSearchTypeMessages).toHaveBeenCalledTimes(1));

      expect(exportSearchTypeMessages).toHaveBeenCalledWith(
        payload,
        'search-id',
        'search-type-id-1',
        'text/csv',
        'Widget-1-search-result.csv',
      );
    });
  });
});
