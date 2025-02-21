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
package org.graylog.datanode.opensearch.configuration.beans.impl;

import com.google.common.collect.Maps;
import jakarta.inject.Inject;
import org.graylog.datanode.Configuration;
import org.graylog.datanode.configuration.DatanodeConfiguration;
import org.graylog.datanode.configuration.DatanodeDirectories;
import org.graylog.datanode.opensearch.configuration.OpensearchConfigurationParams;
import org.graylog.datanode.process.configuration.beans.DatanodeConfigurationBean;
import org.graylog.datanode.process.configuration.beans.DatanodeConfigurationPart;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Properties;
import java.util.function.Supplier;

public class OpensearchPassThroughConfigurationBean implements DatanodeConfigurationBean<OpensearchConfigurationParams> {

    private static final Logger LOG = LoggerFactory.getLogger(OpensearchPassThroughConfigurationBean.class);
    private final Supplier<Map<String, String>> systemEnvSupplier;
    private final DatanodeDirectories datanodeDirectories;
    private final Path overridesFile;

    @Inject
    public OpensearchPassThroughConfigurationBean(DatanodeConfiguration datanodeConfiguration, Configuration configuration) {
        this(datanodeConfiguration.datanodeDirectories(), configuration.getOpensearchConfigurationOverridesFile() , System::getenv);
    }

    public OpensearchPassThroughConfigurationBean(DatanodeDirectories datanodeDirectories, Path overridesFile, Supplier<Map<String, String>> systemEnvSupplier) {
        this.datanodeDirectories = datanodeDirectories;
        this.overridesFile = overridesFile;
        this.systemEnvSupplier = systemEnvSupplier;
    }

    @Override
    public DatanodeConfigurationPart buildConfigurationPart(OpensearchConfigurationParams configurationParams) {

        final DatanodeConfigurationPart.Builder builder = DatanodeConfigurationPart.builder();

        Map<String, String> properties = new LinkedHashMap<>();

        // now copy all the environment values to the configuration arguments. Opensearch won't do it for us,
        // because we are using tar distriburion and opensearch does this only for docker dist. See opensearch-env script
        // additionally, the env variables have to be prefixed with opensearch. (e.g. "opensearch.cluster.routing.allocation.disk.threshold_enabled")
        systemEnvSupplier.get().entrySet().stream()
                .filter(entry -> entry.getKey().matches("^opensearch\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)+"))
                .forEach(entry -> properties.put(entry.getKey().substring("opensearch.".length()), entry.getValue()));

        datanodeDirectories.resolveConfigurationSourceFile(overridesFile)
                .map(this::readPropertiesFile)
                .ifPresent(properties::putAll);

        logWarnings(properties);

        return builder.properties(properties).build();
    }

    private void logWarnings(Map<String, String> properties) {
        if (!properties.isEmpty()) {
            LOG.warn("Your system is overriding opensearch configuration properties. This isn't supported and may break in any future release!");
            properties.forEach((key, value) -> {
                LOG.warn("Detected pass-through opensearch property {}: {}", key, value);
            });
        }
    }

    private Map<String, String> readPropertiesFile(Path file) {
        final Properties properties = new Properties();
        try (final InputStream is = Files.newInputStream(file)) {
            properties.load(is);
            return Maps.fromProperties(properties);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
