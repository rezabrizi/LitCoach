import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@components/ui/command";
import { Button } from "@components/ui/button";

const RESPONSE_STYLES = [
    {
        value: "normal",
        label: "Normal",
    },
    {
        value: "concise",
        label: "Concise",
    },
];

const ResponseStyleSelector = ({ value, onValueChange }) => {
    const [open, setOpen] = useState(false);

    const selectedStyle = RESPONSE_STYLES.find((style) => style.value === value) || RESPONSE_STYLES[0];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-32 justify-between">
                    {selectedStyle.label}
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-32 p-0" align="end">
                <Command>
                    <CommandList>
                        <CommandEmpty>No styles found.</CommandEmpty>
                        <CommandGroup>
                            {RESPONSE_STYLES.map((style) => (
                                <CommandItem
                                    key={style.value}
                                    value={style.value}
                                    onSelect={() => {
                                        onValueChange(style.value);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>{style.label}</span>
                                        {value === style.value && <Check className="h-3 w-3 text-primary" />}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

export default ResponseStyleSelector;
