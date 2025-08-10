import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";

interface OrderTypeProps {
  orderType: string;
  setOrderType: (value: string) => void;
}

const options = [
  { value: "limit", label: "Limit Order" },
  { value: "market", label: "Market Order" },
];

const OrderTypeDropdown: React.FC<OrderTypeProps> = (props) => {
  const { orderType, setOrderType } = props;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 p-2 text-[14px] font-normal rounded-md border border-[#222] bg-black active:bg-[#181818] focus:outline-none focus:ring-2 focus:ring-[#7dfdfe]"
          aria-label="Customise options"
          style={{ minHeight: '40px', touchAction: 'manipulation' }}
        >
          <span>
            {orderType.charAt(0).toUpperCase() + orderType.slice(1)} Order
          </span>
          <ChevronDownIcon className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="DropdownMenuContent z-[999999]" sideOffset={5} style={{ minWidth: '140px', borderRadius: '8px', background: '#181818', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', pointerEvents: 'auto' }}>
          {options.map((option) => (
            <DropdownMenu.Item
              key={option.value}
              className="text-[14px] p-2 cursor-pointer hover:bg-[#100f0f]"
              style={{ minHeight: '38px', pointerEvents: 'auto' }}
              onSelect={() => setOrderType(option.value)}
            >
              <span>{option.label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

export default React.memo(OrderTypeDropdown);
