import React from 'react';
import {DependenciesProvider} from '@akeneo-pim-community/legacy-bridge';
import {ThemeProvider} from 'styled-components';
import {pimTheme} from 'akeneo-design-system';
import {VersioningBrowser} from "../pages/VersioningBrowser";

const VersioningBrowserApp = () => {
    return (
        <DependenciesProvider>
            <ThemeProvider theme={pimTheme}>
                <VersioningBrowser />
            </ThemeProvider>
        </DependenciesProvider>
    )
}

export {VersioningBrowserApp};
  
