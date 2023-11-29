import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ConditionalTableBody,
  FilterToolbar,
  FilterType,
  TableHeaderContentWithBatteries,
  TableRowContentWithBatteries,
  useTablePropHelpers,
  useTableState
} from '@mturley-latest/react-table-batteries';
import {
  Button,
  ButtonVariant,
  Divider,
  EmptyState,
  EmptyStateIcon,
  Icon,
  List,
  ListItem,
  Modal,
  ModalVariant,
  PageSection,
  Pagination,
  TextContent,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { CheckCircleIcon, CubesIcon, ExclamationCircleIcon, ExclamationTriangleIcon, WarningTriangleIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import axios from 'axios';
import moment from 'moment';
import { helpers } from '../../common';
import { ContextIcon, ContextIconVariant } from '../../components/contextIcon/contextIcon';
import { i18nHelpers } from '../../components/i18n/i18nHelpers';
import { RefreshTimeButton } from '../../components/refreshTimeButton/RefreshTimeButton';
import useSearchParam from '../../hooks/useSearchParam';
import { SourceType } from '../../types';
import { ConnectionType } from '../../types';
import SourceActionMenu from './SourceActionMenu';

const SOURCES_LIST_QUERY = 'sourcesList';

const SourceTypeLabels = {
  acs: 'ACS',
  ansible: 'Ansible Controller',
  network: 'Network',
  openshift: 'OpenShift',
  satellite: 'Satellite',
  vcenter: 'vCenter Server'
};

const SourcesListView: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const [refreshTime, setRefreshTime] = React.useState<Date | null>();
  const [credentialsSelected, setCredentialsSelected] = React.useState<any[]>([]);
  const [connectionsSelected, setConnectionsSelected] = React.useState<SourceType>();
  const [connectionsData, setConnectionsData] = React.useState<ConnectionType[]>([]);
  const [sortColumn] = useSearchParam('sortColumn') || ['name'];
  const [sortDirection] = useSearchParam('sortDirection') || ['asc'];
  const [filters] = useSearchParam('filters');
  const [selectedItems, setSelectedItems] = React.useState<SourceType[]>([]);
  const queryClient = useQueryClient();
  const currentQuery = React.useRef<string>('');

  const onRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [SOURCES_LIST_QUERY] });
  };

  const tableState = useTableState({
    persistTo: 'urlParams',
    isSelectionEnabled: true,
    persistenceKeyPrefix: '', // The first Things table on this page.
    columnNames: {
      // The keys of this object define the inferred generic type `TColumnKey`. See "Unique Identifiers".
      name: 'Name',
      connection: 'Last connected',
      type: 'Type',
      credentials: 'Credentials',
      unreachableSystems: 'Unreachable systems',
      scan: ' ',
      actions: ' '
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    // Because isFilterEnabled is true, TypeScript will require these filterCategories:
    filterCategories: [
      {
        key: 'search_by_name',
        title: 'Name',
        type: FilterType.search,
        placeholderText: 'Filter by name'
      },
      {
        key: 'search_credentials_by_name',
        title: 'Credential name',
        type: FilterType.search,
        placeholderText: 'Filter by credential'
      },
      {
        key: 'source_type',
        title: 'Source type',
        type: FilterType.select,
        placeholderText: 'Filter by source type',
        selectOptions: [
          {
            key: 'network',
            label: 'Network',
            value: 'network'
          },
          {
            key: 'openshift',
            label: 'OpenShift',
            value: 'openshift'
          },
          {
            key: 'satellite',
            label: 'Satellite',
            value: 'satellite'
          },
          {
            key: 'vcenter',
            label: 'vCenter',
            value: 'vcenter'
          }
        ]
      }
    ],
    // Because isSortEnabled is true, TypeScript will require these sort-related properties:
    sortableColumns: ['name', 'connection', 'type', 'credentials', 'unreachableSystems'],
    initialSort: {
      columnKey: sortColumn as
        | 'name'
        | 'connection'
        | 'type'
        | 'credentials'
        | 'unreachableSystems',
      direction: sortDirection as 'asc' | 'desc'
    },
    initialFilterValues: filters ? JSON.parse(filters) : undefined
  });

  const {
    filterState: { filterValues },
    sortState: { activeSort },
    paginationState: { pageNumber, itemsPerPage }
  } = tableState;

  React.useEffect(() => {
    const filterParams = filterValues
      ? Object.keys(filterValues)
          .map(key => `${key}=${filterValues[key]}`)
          .join('&')
      : null;

    const ordering = `${(activeSort?.direction ?? sortDirection) === 'desc' ? '-' : ''}${
      activeSort?.columnKey ?? sortColumn
    }`;

    const query =
      `${process.env.REACT_APP_SOURCES_SERVICE}` +
      `?` +
      `ordering=${ordering}` +
      `&` +
      `page=${pageNumber}` +
      `&` +
      `page-size=${itemsPerPage}${filterParams ? `&${filterParams}` : ''}`;

    if (query !== currentQuery.current) {
      currentQuery.current = query;
      queryClient.invalidateQueries({ queryKey: [SOURCES_LIST_QUERY] });
    }
  }, [filterValues, activeSort, sortDirection, sortColumn, pageNumber, itemsPerPage, queryClient]);


  const { isLoading, data } = useQuery({
    queryKey: [SOURCES_LIST_QUERY],
    refetchOnWindowFocus: !helpers.DEV_MODE,
    queryFn: () => {
      console.log(`Query: `, currentQuery.current);
      return axios.get(currentQuery.current, { headers: {"Authorization": 'Token 2f5718d8a2a9f2d286b115a7e5d9d96a57e0c96d'}})
        .then(res => {
          setRefreshTime(new Date());
          return res.data;
        })
        .catch(err => console.error(err));
    }
  });

  let totalResults = data?.count || 0;
  if (helpers.DEV_MODE) {
    totalResults = helpers.devModeNormalizeCount(totalResults);
  }

  const tableBatteries = useTablePropHelpers({
    ...tableState,
    idProperty: 'id',
    isLoading,
    currentPageItems: (data?.results || []) as SourceType[],
    totalItemCount: totalResults,
    selectionState: {
      selectedItems,
      setSelectedItems,
      isItemSelected: (item: SourceType) => !!selectedItems.find(i => i.id === item.id),
      isItemSelectable: () => true,
      toggleItemSelected: (item: SourceType) => {
        const index = selectedItems.findIndex(i => i.id === item.id);
        if (index > -1) {
          setSelectedItems(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
        } else {
          setSelectedItems(prev => [...prev, item]);
        }
      },
      selectMultiple: () => {},
      areAllSelected: false,
      selectAll: () => {}
    }
  });

  const {
    currentPageItems, // These items have already been paginated.
    // `numRenderedColumns` is based on the number of columnNames and additional columns needed for
    // rendering controls related to features like selection, expansion, etc.
    // It is used as the colSpan when rendering a full-table-wide cell.
    numRenderedColumns,
    // The objects and functions in `propHelpers` correspond to the props needed for specific PatternFly or Tackle
    // components and are provided to reduce prop-drilling and make the rendering code as short as possible.
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps
    }
  } = tableBatteries;

  const onCloseConnections = () => {
    setConnectionsSelected(undefined);
    setConnectionsData([]);
  }
  const onShowAddSourceWizard = () => {};
  const onScanSources = () => {};
  const onScanSource = (source: SourceType) => {
    alert(`Scan: ${source.name}`);
  };

  const renderToolbar = () => (
    <Toolbar {...toolbarProps}>
      <ToolbarContent>
        <FilterToolbar {...filterToolbarProps} id="client-paginated-example-filters" />
        {/* You can render whatever other custom toolbar items you may need here! */}
        <Divider orientation={{ default: 'vertical' }} />
        <ToolbarItem>
          <RefreshTimeButton lastRefresh={refreshTime?.getTime() ?? 0} onRefresh={onRefresh} />
          <Button className="pf-v5-u-mr-md" onClick={onShowAddSourceWizard} ouiaId="add_source">
            {t('table.label', { context: 'add' })}
          </Button>{' '}
          <Button
            variant={ButtonVariant.secondary}
            isDisabled={
              Object.values(tableBatteries.selectionState.selectedItems).filter(val => val !== null)
                .length <= 1
            }
            onClick={onScanSources}
          >
            {t('table.label', { context: 'scan' })}
          </Button>
        </ToolbarItem>
        <ToolbarItem {...paginationToolbarItemProps}>
          <Pagination
            variant="top"
            isCompact
            {...paginationProps}
            widgetId="client-paginated-example-pagination"
          />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
  
  const showConnections = (source: SourceType) => {
    axios.get(`https://0.0.0.0:9443/api/v1/jobs/${source.connection.id}/connection/?page=1&page_size=1000&ordering=name&source_type=${source.id}`,
      { headers: {"Authorization": 'Token 2f5718d8a2a9f2d286b115a7e5d9d96a57e0c96d'}})
        .then(res => {
          console.log(res);
          setConnectionsData(res.data.results);
        })
        .catch(err => console.error(err));
    setConnectionsSelected(source);
  };

  const getTimeDisplayHowLongAgo =
    process.env.REACT_APP_ENV !== 'test'
      ? timestamp => moment().utc(timestamp).utcOffset(moment().utcOffset()).fromNow()
      : () => 'a day ago';

  const renderConnection = (source: SourceType): React.ReactNode => {
    if (!source?.connection) {
      return null;
    }
    const isPending =
      source.connection.status === 'created' ||
      source.connection.status === 'pending' ||
      source.connection.status === 'running';
    const scanTime = (isPending && source.connection.start_time) || source.connection.end_time;

    const statusString = i18nHelpers.translate(t, 'table.label', {
      context: ['status', source.connection.status, 'sources']
    });
    return (
      <Button variant={ButtonVariant.link} onClick={() => {
        showConnections(source);
      }}>
        <ContextIcon symbol={ContextIconVariant[source.connection.status]} />
        {' '}{statusString}{' '}
        {getTimeDisplayHowLongAgo(scanTime)}
      </Button>
    );
  };

  return (
    <PageSection variant="light">
      {renderToolbar()}
      <Table {...tableProps} aria-label="Example things table" variant="compact">
        <Thead>
          <Tr>
            <TableHeaderContentWithBatteries {...tableBatteries}>
              <Th {...getThProps({ columnKey: 'name' })} />
              <Th {...getThProps({ columnKey: 'connection' })} />
              <Th {...getThProps({ columnKey: 'type' })} />
              <Th {...getThProps({ columnKey: 'credentials' })} />
              {/* <Th {...getThProps({ columnKey: 'unreachableSystems' })} /> */}
              <Th {...getThProps({ columnKey: 'scan' })} />
              <Th {...getThProps({ columnKey: 'actions' })} />
            </TableHeaderContentWithBatteries>
          </Tr>
        </Thead>
        <ConditionalTableBody
          isLoading={isLoading}
          isNoData={currentPageItems.length === 0}
          noDataEmptyState={
            <EmptyState variant="sm">
              <EmptyStateIcon icon={CubesIcon} />
              <Title headingLevel="h2" size="lg">
                No things available
              </Title>
            </EmptyState>
          }
          numRenderedColumns={numRenderedColumns}
        >
          <Tbody>
            {currentPageItems?.map((source: SourceType, rowIndex) => (
              <Tr key={source.id} {...getTrProps({ item: source })}>
                <TableRowContentWithBatteries {...tableBatteries} item={source} rowIndex={rowIndex}>
                  <Td {...getTdProps({ columnKey: 'name' })}>{source.name}</Td>
                  <Td {...getTdProps({ columnKey: 'connection' })}>{renderConnection(source)}</Td>
                  <Td {...getTdProps({ columnKey: 'type' })}>
                    {SourceTypeLabels[source.source_type]}
                  </Td>
                  <Td {...getTdProps({ columnKey: 'credentials' })}><Button variant={ButtonVariant.link} onClick={() => {
                    setCredentialsSelected(source.credentials)
                  }}>{source.credentials.length}</Button></Td>
                  {/* <Td {...getTdProps({ columnKey: 'unreachableSystems' })}>
                    {helpers.devModeNormalizeCount(
                      source.connection?.source_systems_unreachable ?? 0
                    )}
                  </Td> */}
                  <Td isActionCell {...getTdProps({ columnKey: 'scan' })}>
                    <Button variant={ButtonVariant.link} onClick={() => onScanSource(source)}>
                      Scan
                    </Button>
                  </Td>
                </TableRowContentWithBatteries>
                <Td isActionCell {...getTdProps({ columnKey: 'actions' })}>
                  <SourceActionMenu source={source} />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </ConditionalTableBody>
      </Table>
      <Pagination
        variant="bottom"
        isCompact
        {...paginationProps}
        widgetId="server-paginated-example-pagination"
      />
      {!!credentialsSelected.length && (
          <Modal
            variant={ModalVariant.small}
            title="Credentials"
            isOpen={!!credentialsSelected}
            onClose={() => setCredentialsSelected([])}
            actions={[
              <Button key="cancel" variant="secondary" onClick={() => setCredentialsSelected([])}>
                Close
              </Button>
            ]}
          >
            <List isPlain isBordered>
              {credentialsSelected.map((c, i) => (
                <ListItem>
                  {c.name}
                </ListItem>
              ))}
            </List>
          </Modal>
      )}
      {connectionsSelected && (
          <Modal
            variant={ModalVariant.small}
            title={connectionsSelected.name}
            isOpen={!!connectionsSelected}
            onClose={onCloseConnections}
            actions={[
              <Button key="cancel" variant="secondary" onClick={onCloseConnections}>
                Close
              </Button>
            ]}
          >
            <TextContent style={{margin: '1em 0'}}><h5><Icon status="danger"><ExclamationCircleIcon /></Icon> Failed connections</h5></TextContent>
            <List isPlain isBordered>
            {connectionsData.filter(c => c.status === "failed").map((con) => (
                <ListItem>{con.name}</ListItem>
              ))}
            </List>
            <TextContent style={{margin: '1em 0'}}><h5><Icon status="warning"><ExclamationTriangleIcon /></Icon> Unreachable systems</h5></TextContent>
            <List isPlain isBordered>
            {connectionsData.filter(c => !["success", "failed"].includes(c.status)).map((con) => (
                <ListItem>{con.name}</ListItem>
              ))}
            </List>
            <TextContent style={{margin: '1em 0'}}><h5><Icon status="success"><CheckCircleIcon /></Icon>  Successful connections</h5></TextContent>
            <List isPlain isBordered>
              {connectionsData.filter(c => c.status === "success").map((con) => (
                <ListItem>{con.name}</ListItem>
              ))}
            </List>
          </Modal>
      )}

    </PageSection>
  );
};

export default SourcesListView;



  // const sourcesData = {
  //   "count": 2,
  //   "next": null,
  //   "previous": null,
  //   "results": [
  //       {
  //           "id": 1,
  //           "name": "Peripherals",
  //           "source_type": "openshift",
  //           "port": 443,
  //           "hosts": [
  //               "4444"
  //           ],
  //           "options": {
  //               "ssl_protocol": "SSLv23",
  //               "ssl_cert_verify": true
  //           },
  //           "credentials": [
  //               {
  //                   "id": 1,
  //                   "name": "Peripherals"
  //               }
  //           ],
  //           "connection": {
  //               "id": 1,
  //               "start_time": "2023-11-15T18:18:31.562241",
  //               "end_time": "2023-11-15T18:18:31.636013",
  //               "systems_count": 1,
  //               "systems_scanned": 0,
  //               "systems_failed": 0,
  //               "systems_unreachable": 1,
  //               "system_fingerprint_count": 0,
  //               "status_details": {
  //                   "job_status_message": "The following tasks failed: 1",
  //                   "task_1_status_message": "Unable to connect to OpenShift host."
  //               },
  //               "status": "failed",
  //               "source_systems_count": 1,
  //               "source_systems_scanned": 0,
  //               "source_systems_failed": 0,
  //               "source_systems_unreachable": 1
  //           }
  //       },
  //       {
  //           "id": 2,
  //           "name": "vcsource",
  //           "source_type": "vcenter",
  //           "port": 443,
  //           "hosts": [
  //               "vcenter.toledo.satellite.lab.eng.rdu2.redhat.com"
  //           ],
  //           "options": {
  //               "ssl_protocol": "SSLv23",
  //               "ssl_cert_verify": false
  //           },
  //           "credentials": [
  //               {
  //                   "id": 2,
  //                   "name": "vcenter pass"
  //               }
  //           ],
  //           "connection": {
  //               "id": 3,
  //               "report_id": 1,
  //               "start_time": "2023-11-15T19:23:44.062270",
  //               "end_time": "2023-11-15T19:23:48.851240",
  //               "systems_count": 160,
  //               "systems_scanned": 160,
  //               "systems_failed": 0,
  //               "systems_unreachable": 0,
  //               "system_fingerprint_count": 160,
  //               "status_details": {
  //                   "job_status_message": "Job is complete."
  //               },
  //               "status": "completed",
  //               "source_systems_count": 160,
  //               "source_systems_scanned": 160,
  //               "source_systems_failed": 0,
  //               "source_systems_unreachable": 0
  //           }
  //       }
  //   ]
  // };