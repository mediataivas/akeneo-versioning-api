import React from 'react';
import {ReactController} from '@akeneo-pim-community/legacy-bridge/src/bridge/react';
import {VersioningBrowserApp} from "../apps/VersioningBrowserApp";

const mediator = require('oro/mediator');

class VersioningApiIndexController extends ReactController {
    routeGuardToUnmount(): RegExp {
        return /^versioning_api_pages_index/;
    }
    reactElementToMount() {
        return <VersioningBrowserApp/>;
    }
    renderRoute() {
        mediator.trigger('pim_menu:highlight:tab', {extension: 'pim-menu-versioning'});
        //mediator.trigger('pim_menu:highlight:item', {extension: 'pim-menu-system-info'});

        return super.renderRoute();
    }
}

export = VersioningApiIndexController;
