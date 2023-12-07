import React, { useState } from "react";

import {
    Dropdown,
    DropdownList,
    MenuToggle,
    MenuToggleElement,
} from "@patternfly/react-core";

export interface ISimpleDropdownProps {
    label: string;
    dropdownItems?: React.ReactNode[];
    ariaLabel?: string;
    onSelect?: () => {};
    variant: 'default' | 'plain' | 'primary' | 'secondary';
}

export const SimpleDropdown: React.FC<ISimpleDropdownProps> = ({
    label,
    dropdownItems,
    ariaLabel,
    onSelect,
    variant,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Dropdown
            isOpen={isOpen}
            onOpenChange={(isOpen) => setIsOpen(isOpen)}
            onSelect={onSelect}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                    ref={toggleRef}
                    isExpanded={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                    variant={variant}
                    aria-label={ariaLabel || "Dropdown menu"}
                    isDisabled={!dropdownItems || dropdownItems.length === 0}
                >
                    {label}
                </MenuToggle>
            )}
        >
            <DropdownList>{dropdownItems}</DropdownList>
        </Dropdown>
    );
};
