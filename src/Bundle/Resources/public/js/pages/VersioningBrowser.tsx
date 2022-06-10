import React, {useEffect, useState} from 'react';
import styled from "styled-components";
import {PageContent, PageHeader, useRoute, useRouter, useTranslate, PimView} from '@akeneo-pim-community/shared';
import {
    Breadcrumb,
    Button,
    Link,
    MultiSelectInput,
    Pagination,
    SectionTitle,
    SubNavigationPanel,
    Table
} from 'akeneo-design-system';
import DatePicker from 'react-datepicker';
import {format, subWeeks} from 'date-fns';

import "react-datepicker/dist/react-datepicker.css";

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;`
const PageWrapper = styled.div``

const VersioningBrowser = () => {
    const translate = useTranslate();
    const versioningHomeRoute = useRoute('versioning_api_pages_index');
    const attributeApiRoute = useRoute('pim_enrich_attribute_rest_index');
    const versioningApiRoute = useRoute('versioning_api_internal_controller');
    const router = useRouter();
    const [attributeOptions, setAttributeOptions] = useState();
    const [userOptions, setUserOptions] = useState();
    const [attributeValues, setAttributeValues] = useState<string[]>([]);
    const [userValues, setUserValues] = useState<string[]>([]);
    const [startDate, setStartDate] = useState(subWeeks(new Date(), 1));
    const [endDate, setEndDate] = useState(new Date());
    const [isOpen, setIsOpen] = useState(true);
    const [revisions, setRevisions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [numResults, setNumResults] = useState(0);
    useEffect(() => {
        async function initialize() {
            const attributes = await fetch(attributeApiRoute + '?options[limit]=9001');
            const attributeJson = await attributes.json();
            setAttributeOptions(attributeJson);
            const users = await fetch('/datagrid/pim-user-grid/load');
            let usersJson = await users.json();
            usersJson = JSON.parse(usersJson.data);
            usersJson.data[usersJson.data.length + 1] = {
                username: 'system',
                firstName: 'Akeneo',
                lastName: 'Backend'
            }
            setUserOptions(usersJson.data);
        }
        initialize();
    }, []);
    useEffect(() => {
        if (currentPage !== 0) {
            doSearch();
        }
    }, [currentPage])

    const doSearch = async () => {
        const query = {
            field: attributeValues,
            author: userValues,
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
        const paging = {
            page: currentPage,
            page_size: 25
        };
        const response = await fetch(versioningApiRoute + '?search=' + JSON.stringify(query) + '&pager=' + JSON.stringify(paging));
        const responseJson = await response.json();
        if (responseJson.total === 0) {
            setCurrentPage(0);
        }
        setNumResults(responseJson.total);
        setRevisions(responseJson.items);
    }

    return (
        <PageWrapper className="AknDefault-contentWithColumn">
            <SubNavigationPanel
                open={() => setIsOpen(true)}
                close={() => setIsOpen(false)}
                isOpen={isOpen}
            >
                <SectionTitle>
                    <SectionTitle.Title>Filters</SectionTitle.Title>
                </SectionTitle>
                <MultiSelectInput
                    emptyResultLabel=""
                    onChange={(newValue: string[]) => {setAttributeValues(newValue)}}
                    placeholder="Select attributes to search for"
                    value={attributeValues}
                    className="AknFilterBox-filter"
                >
                    {attributeOptions && attributeOptions.map((item) => {
                        return <MultiSelectInput.Option key={item.code} value={item.code}>
                            {(item.labels['fi_FI'] ?? item.labels['en_US'] ?? Object.values(item.labels)[0]) + ' [' + item.code + ']'}
                        </MultiSelectInput.Option>
                    })
                    }
                </MultiSelectInput>
                <DatePicker
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeFormat="HH:mm"
                    showTimeInput
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="AknFilterBox-filter"
                />
                <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    dateFormat="yyyy-MM-dd HH:mm"
                    timeFormat="HH:mm"
                    showTimeInput
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="AknFilterBox-filter"
                />
                <MultiSelectInput
                    placeholder="Select author"
                    emptyResultLabel=""
                    onChange={(newValue: string[]) => {setUserValues(newValue)}}
                    value={userValues}
                    className="AknFilterBox-filter"
                >
                {userOptions && userOptions.map((user) => {
                    return <MultiSelectInput.Option
                        key={user.username}
                        value={user.username}
                    >
                        {user.firstName.concat(' ', user.lastName, ' [', user.username, ']')}
                    </MultiSelectInput.Option>
                })}
                </MultiSelectInput>
                <Button
                    //disabled={attributeValues?.length === 0}
                    onClick={() => {
                        if (currentPage !== 1) {
                            setCurrentPage(1);
                        } else {
                            doSearch();
                        }
                    }}
                    className="AknFilterBox-filter"
                >Search</Button>
            </SubNavigationPanel>
            <ContentWrapper>
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
                { revisions.length > 0 &&
                    <PageContent>
                        <Pagination
                            currentPage={currentPage}
                            itemsPerPage={100}
                            followPage={(e: number) => {
                                setCurrentPage(e)
                            }}
                            totalItems={numResults}
                        />
                        <Table>
                            <Table.Header>
                                <Table.HeaderCell>Date</Table.HeaderCell>
                                <Table.HeaderCell>Author</Table.HeaderCell>
                                <Table.HeaderCell>Resource</Table.HeaderCell>
                                <Table.HeaderCell>Changes</Table.HeaderCell>
                            </Table.Header>
                            <Table.Body>
                                {revisions
                                    .map((item, index) => {
                                        return (
                                            <Table.Row key={"row" + index}>
                                                <Table.Cell>{item.logged_at}</Table.Cell>
                                                <Table.Cell>{item.author}</Table.Cell>
                                                <Table.Cell>
                                                    <Link
                                                        href={`#${
                                                            router.generate(
                                                                'pim_enrich_product_edit',
                                                                {id: item.resource_id}
                                                            )
                                                        }`}
                                                    >{item.snapshot.name}</Link>
                                                </Table.Cell>
                                                <Table.Cell><pre>{JSON.stringify(item.changeset, null, 2)}</pre></Table.Cell>
                                            </Table.Row>
                                        );
                                    })
                                }
                            </Table.Body>
                        </Table>
                    </PageContent>
                }
                { revisions.length === 0 &&
                    <>No results</>
                }
            </ContentWrapper>
        </PageWrapper>
    )
}
export {VersioningBrowser};
