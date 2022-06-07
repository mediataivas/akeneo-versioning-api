import React, {useEffect, useState} from 'react';
import styled from "styled-components";
import {PageContent, PageHeader, useRoute, useTranslate, PimView} from '@akeneo-pim-community/shared';
import {Breadcrumb, Button, Table, MultiSelectInput} from 'akeneo-design-system';
import DatePicker from 'react-datepicker';
import {format, subMonths} from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

const VersioningBrowser = () => {
    const translate = useTranslate();
    const versioningHomeRoute = useRoute('versioning_api_pages_index');
    const attributeApiRoute = useRoute('pim_enrich_attribute_rest_index');
    const versioningApiRoute = useRoute('versioning_api_internal_controller');
    const [attributeOptions, setAttributeOptions] = useState();
    const [attributeValues, setAttributeValues] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
    const [endDate, setEndDate] = useState(new Date());
    useEffect(() => {
        async function initialize() {
            const attributes = await fetch(attributeApiRoute + '?options[limit]=9001');
            setAttributeOptions(await attributes.json());
        }
        initialize();
    }, [])

    const doSearch = async () => {
        const query = {
            logged_at: [
                {
                    operator: 'BETWEEN',
                    value: [
                        format(startDate, 'yyyy-MM-dd HH:mm:ss'),
                        format(endDate, 'yyyy-MM-dd HH:mm:ss')
                    ]
                }
            ]
        };
        const response = await fetch(versioningApiRoute + '?search=' + JSON.stringify(query));
        console.log(await response.json());
    }

    return (
        <>
            <PageHeader>
                <PageHeader.Breadcrumb>
                    <Breadcrumb>
                        <Breadcrumb.Step href={`#${versioningHomeRoute}`}>Versioning</Breadcrumb.Step>
                    </Breadcrumb>
                </PageHeader.Breadcrumb>
                <PageHeader.UserActions>
                    <PimView
                        viewName="pim-menu-user-navigation"
                        className="AknTitleContainer-userMenuContainer AknTitleContainer-userMenu"
                    />
                </PageHeader.UserActions>
            </PageHeader>
            <PageContent>
                <MultiSelectInput
                    emptyResultLabel=""
                    onChange={(newValue: string[]) => {setAttributeValues(newValue)}}
                    onSearchChange={() => {}}
                    placeholder="Select attributes to search for"
                    value={attributeValues}
                >
                {attributeOptions && attributeOptions.map((item) => {
                    return <MultiSelectInput.Option key={item.code} value={item.code}>
                        {item.labels['en_US'] + ' [' + item.code + ']'}
                    </MultiSelectInput.Option>
                })
                }
                </MultiSelectInput>
                <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeFormat="HH:mm"
                    showTimeInput
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeFormat="HH:mm"
                    showTimeInput
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                />
                <Button
                    disabled={attributeValues?.length === 0}
                    onClick={doSearch}
                >Search</Button>
                <Table>
                    <Table.Header>
                        <Table.HeaderCell>Date</Table.HeaderCell>
                        <Table.HeaderCell>Resource</Table.HeaderCell>
                        <Table.HeaderCell>Changes</Table.HeaderCell>
                    </Table.Header>
                    <Table.Body></Table.Body>
                </Table>
            </PageContent>
        </>
    )
}
export {VersioningBrowser};
