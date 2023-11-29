import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageSection, Title } from '@patternfly/react-core';
import axios from 'axios';

const CREDS_LIST_QUERY = 'credentialsList';

const CredentialsListView: React.FunctionComponent = () => {
  useQuery({
    queryKey: [CREDS_LIST_QUERY],
    queryFn: () => axios.get('https://0.0.0.0:9443/api/v1/credentials/?ordering=name&page=1&page_size=10').then(res => res.data)
  });

  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Credentials table goes here
      </Title>
    </PageSection>
  );
};

export default CredentialsListView;
