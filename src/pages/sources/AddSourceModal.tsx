import { ActionGroup, Button, Checkbox, Form, FormContextProvider, FormGroup, HelperText, Modal, ModalVariant, NumberInput, TextArea, TextContent, TextInput } from '@patternfly/react-core';
import * as React from 'react';
import axios from 'axios';
import { TypeaheadCheckboxes } from 'src/components/TypeaheadCheckboxes';
import { SourceType } from 'src/types';

export interface AddSourceModalProps {
    type: string;
    onClose: () => void;
    onSubmit: (payload) => void;
}

const AddSourceModal: React.FC<AddSourceModalProps> = ({
    type,
    onClose,
    onSubmit
}) => {
    const [credOptions, setCredOptions] = React.useState<{value: string, label: string}[]>([]);
    const [credentials, setCredentials] = React.useState<string[]>([]);
    const [useParamiko, setUseParamiko] = React.useState<boolean>(false);

    const typeValue = type.split(' ').shift()?.toLowerCase();
    //example payload:
    const payload = {
        "source_type": typeValue,
        "credentials": credentials,
        "hosts": [
            "124.124.142"
        ],
        "name": "network source name",
        "port": "23",
        "options": {
            "use_paramiko": true
        }
    }
    //nonnetwork, url sources/?scan=true
    const payload2 = {
        "source_type": typeValue,
        "credentials": [
            2
        ],
        "hosts": [
            "123.123.123"
        ],
        "name": "vcenter source name",
        "port": 443,
        "options": {
            "ssl_cert_verify": true,
            "ssl_protocol": "SSLv23",
            "disable_ssl": false
        }
    }
    React.useEffect(() => {
        axios.get(
            `https://0.0.0.0:9443/api/v1/credentials/?cred_type=${typeValue}`,
            { headers: { "Authorization": `Token ${localStorage.getItem('authToken')}`}}
        ).then(res => {
            setCredOptions(res.data.results.map(o => ({label: o.name, value: ""+o.id})));
        }).catch(err => console.error(err));
    }, [])

    const onAdd = (values) => {
        const payload = {
            "source_type": typeValue,
            "credentials": credentials,
            "hosts": values['hosts'].split(','),
            "name": values['name'],
            "port": values['port'],
            "options": {
                "use_paramiko": useParamiko
            }
        };
        onSubmit(payload);
    }

    return (
        <Modal
            variant={ModalVariant.small}
            title={`Add source: ${type}`}
            isOpen={!!type}
            onClose={onClose}
        >
            <FormContextProvider>
                {({ setValue, getValue, setError, values, errors }) => (
                    <Form isHorizontal>
                        <FormGroup label="Name" isRequired fieldId="name">
                            <TextInput
                                value={getValue('name')}
                                placeholder="Enter a name for the source"
                                isRequired
                                type="text"
                                id="source-name"
                                name="name"
                                onChange={(ev) => { setValue('name', (ev.target as HTMLInputElement).value) }}
                            />
                        </FormGroup>
                        <FormGroup label="Search addresses" isRequired fieldId="hosts">
                            <TextArea
                                placeholder='Enter values separated by commas'
                                value={getValue('hosts')}
                                onChange={(_ev, val) => setValue('hosts', val)}
                                isRequired
                                id="source-hosts"
                                name="hosts"
                            />
                            <HelperText>Type IP addresses, IP ranges, and DNS host names. Wildcards are valid. Use CIDR or Ansible notation for ranges.</HelperText>
                        </FormGroup>
                        <FormGroup label="Port" fieldId="port">
                            <TextInput
                                value={getValue('port')}
                                placeholder="Optional"
                                type="text"
                                id="source-port"
                                name="port"
                                onChange={(ev) => { console.log(credOptions); setValue('port', (ev.target as HTMLInputElement).value) }}
                            />
                            <HelperText>Default port is 22.</HelperText>
                        </FormGroup>
                        <FormGroup
                            label="Credential"
                            fieldId="credentials"
                            isRequired
                        >
                            <TypeaheadCheckboxes
                                onChange={setCredentials}
                                options={credOptions}
                            />
                        </FormGroup>
                        <FormGroup
                            label=""
                            fieldId="paramiko"
                        >
                            <Checkbox
                                key='paramiko'
                                label='Connect using Paramiko instead of Open SSH'
                                id='paramiko'
                                isChecked={useParamiko}
                                onChange={(_ev, ch) => setUseParamiko(ch)}
                            />
                        </FormGroup>
                        <ActionGroup>
                            <Button variant="primary" onClick={() => onAdd({ ...values })}>Save</Button>
                            <Button variant="link" onClick={onClose}>Cancel</Button>
                        </ActionGroup>
                    </Form>
                )}
            </FormContextProvider>
        </Modal>
    )
}

export default AddSourceModal;