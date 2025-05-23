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
import Reflux from 'reflux';
import pull from 'lodash/pull';

import fetch from 'logic/rest/FetchProvider';
import ApiRoutes from 'routing/ApiRoutes';
import { qualifyUrl } from 'util/URLUtils';
import UserNotification from 'util/UserNotification';
import PaginationURL from 'util/PaginationURL';
import StreamsActions from 'actions/streams/StreamsActions';
import { singletonStore } from 'logic/singleton';
import { CurrentUserStore } from 'stores/users/CurrentUserStore';
import type { Attributes } from 'stores/PaginationTypes';
import type { Stream as OriginalStream, StreamRule as OriginalStreamRule } from 'logic/streams/types';

export type Stream = OriginalStream;

export type StreamRuleType = {
  id: number;
  short_desc: string;
  long_desc: string;
  name: string;
};

export type StreamRule = OriginalStreamRule;

type OutputSummary = {
  id: string;
  title: string;
  type: string;
  creator_user_id: string;
  created_at: string;
  configuration: { [key: string]: string };
};

type AlertConditionSummary = {
  id: string;
  type: string;
  creator_user_id: string;
  created_at: string;
  parameters: { [key: string]: any };
  in_grace: boolean | null | undefined;
  title: string | null | undefined;
};

export type StreamConfiguration = Pick<
  Stream,
  | 'index_set_id'
  | 'title'
  | 'matching_type'
  | 'remove_matches_from_default_stream'
  | 'description'
  | 'rules'
  | 'content_pack'
>;

type AlertReceiver = {
  emails: string[];
  users: string[];
};

export type StreamResponse = {
  id: string;
  creator_user_id: string;
  outputs: OutputSummary[];
  matching_type: string;
  description: string;
  created_at: string;
  disabled: boolean;
  rules: StreamRule[];
  alert_conditions: AlertConditionSummary[];
  alert_receivers: AlertReceiver;
  title: string;
  is_default: boolean | null | undefined;
  is_editable: boolean;
  remove_matches_from_default_stream: boolean;
  index_set_id: string;
  categories: string[];
};

type TestMatchResponse = {
  matches: boolean;
  rules: any;
};

type Callback = {
  (): void;
};

type StreamSummaryResponse = {
  total: number;
  streams: Array<Stream>;
};

type PaginatedResponse = {
  pagination: {
    count: number;
    total: number;
    page: number;
    per_page: number;
  };
  query: string;
  attributes: Attributes;
  elements: Array<Stream>;
};

export type MatchData = {
  matches: boolean;
  rules: { [id: string]: false };
};

const StreamsStore = singletonStore('Streams', () =>
  Reflux.createStore({
    listenables: [StreamsActions],

    callbacks: [],

    searchPaginated(newPage, newPerPage, newQuery, additional) {
      const url = PaginationURL(
        ApiRoutes.StreamsApiController.paginated().url,
        newPage,
        newPerPage,
        newQuery,
        additional,
      );

      const promise = fetch('GET', qualifyUrl(url)).then((response: PaginatedResponse) => {
        const {
          elements,
          query,
          attributes,
          pagination: { count, total, page, per_page: perPage },
        } = response;

        return {
          list: elements,
          attributes,
          pagination: {
            count,
            total,
            page,
            perPage,
            query,
          },
        };
      });

      StreamsActions.searchPaginated.promise(promise);

      return promise;
    },
    listStreams() {
      const url = '/streams';

      const promise = fetch('GET', qualifyUrl(url))
        .then((result: StreamSummaryResponse) => result.streams)
        .catch((errorThrown) => {
          UserNotification.error(`Loading streams failed with status: ${errorThrown}`, 'Could not load streams');
        });

      StreamsActions.listStreams.promise(promise);

      return promise;
    },
    load(callback: (streams: Array<Stream>) => void) {
      this.listStreams().then((streams) => {
        callback(streams);
      });
    },
    remove(streamId: string) {
      const url = qualifyUrl(ApiRoutes.StreamsApiController.delete(streamId).url);

      const promise = fetch('DELETE', url).then(() => CurrentUserStore.reload().then(this._emitChange.bind(this)));

      StreamsActions.remove.promise(promise);

      return promise;
    },
    pause(streamId: string, callback: () => void) {
      const failCallback = (errorThrown) => {
        UserNotification.error(`Pausing Stream failed with status: ${errorThrown}`, 'Could not pause Stream');
      };

      const url = qualifyUrl(ApiRoutes.StreamsApiController.pause(streamId).url);

      const promise = fetch('POST', url)
        .then(callback, failCallback)
        .then((response) => {
          this._emitChange();

          return response;
        });

      StreamsActions.pause.promise(promise);

      return promise;
    },
    resume(streamId: string, callback: () => void) {
      const failCallback = (errorThrown) => {
        UserNotification.error(`Resuming Stream failed with status: ${errorThrown}`, 'Could not resume Stream');
      };

      const url = qualifyUrl(ApiRoutes.StreamsApiController.resume(streamId).url);

      const promise = fetch('POST', url)
        .then(callback, failCallback)
        .then((response) => {
          this._emitChange();

          return response;
        });

      StreamsActions.resume.promise(promise);

      return promise;
    },
    save(stream: StreamConfiguration, callback: (streamId: string) => void) {
      const failCallback = (errorThrown) => {
        UserNotification.error(`Saving Stream failed with status: ${errorThrown}`, 'Could not save Stream');
      };

      const url = qualifyUrl(ApiRoutes.StreamsApiController.create().url);

      const promise = fetch('POST', url, stream)
        .then(callback, failCallback)
        .then(() => CurrentUserStore.reload().then(this._emitChange.bind(this)));

      StreamsActions.save.promise(promise);

      return promise;
    },
    update(streamId: string, data: any, callback: (stream: Stream) => void) {
      const failCallback = (errorThrown) => {
        UserNotification.error(`Updating Stream failed with status: ${errorThrown}`, 'Could not update Stream');
      };

      const url = qualifyUrl(ApiRoutes.StreamsApiController.update(streamId).url);

      const promise = fetch('PUT', url, data).then(callback, failCallback).then(this._emitChange.bind(this));

      StreamsActions.update.promise(promise);

      return promise;
    },
    cloneStream(streamId: string, data: any, callback: (streamId: string) => void) {
      const failCallback = (errorThrown) => {
        UserNotification.error(`Cloning Stream failed with status: ${errorThrown}`, 'Could not clone Stream');
      };

      const url = qualifyUrl(ApiRoutes.StreamsApiController.cloneStream(streamId).url);

      const promise = fetch('POST', url, data)
        .then(callback, failCallback)
        .then(() => CurrentUserStore.reload().then(this._emitChange.bind(this)));

      StreamsActions.cloneStream.promise(promise);

      return promise;
    },
    removeOutput(streamId: string, outputId: string, callback: () => void) {
      const url = qualifyUrl(ApiRoutes.StreamOutputsApiController.delete(streamId, outputId).url);

      const promise = fetch('DELETE', url)
        .then(callback, (errorThrown) => {
          UserNotification.error(
            `Removing output from stream failed with status: ${errorThrown}`,
            'Could not remove output from stream',
          );
        })
        .then(this._emitChange.bind(this));

      StreamsActions.removeOutput.promise(promise);

      return promise;
    },
    addOutput(streamId: string, outputId: string, callback: (response: any) => void) {
      const url = qualifyUrl(ApiRoutes.StreamOutputsApiController.add(streamId).url);

      const promise = fetch('POST', url, { outputs: [outputId] })
        .then(callback, (errorThrown) => {
          UserNotification.error(
            `Adding output to stream failed with status: ${errorThrown}`,
            'Could not add output to stream',
          );
        })
        .then(this._emitChange.bind(this));

      StreamsActions.addOutput.promise(promise);

      return promise;
    },
    testMatch(streamId: string, message: any, callback: (response: TestMatchResponse) => void) {
      const url = qualifyUrl(ApiRoutes.StreamsApiController.testMatch(streamId).url);

      const promise = fetch('POST', url, message).then(callback, (error) => {
        UserNotification.error(
          `Testing stream rules of stream failed with status: ${error.message}`,
          'Could not test stream rules of stream',
        );
      });

      StreamsActions.testMatch.promise(promise);

      return promise;
    },
    onChange(callback: Callback) {
      this.callbacks.push(callback);
    },
    _emitChange() {
      this.callbacks.forEach((callback) => callback());
    },
    unregister(callback: Callback) {
      pull(this.callbacks, callback);
    },
  }),
);

export { StreamsStore, StreamsActions };
export default StreamsStore;
