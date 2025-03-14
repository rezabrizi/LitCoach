import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@components/ui/command";
import { Button } from "@components/ui/button";

const RESPONSE_STYLES = [
    {
        value: "normal",
        label: "Normal",
        description:
            "Provides detailed, mentor-like guidance with step-by-step explanations and optimization strategies while avoiding direct solutions",
    },
    {
        value: "interview",
        label: "Interview",
        description:
            "Simulates a technical interview by giving minimal hints, probing reasoning, and focusing on solution evaluation and complexity analysis",
    },
    {
        value: "concise",
        label: "Concise",
        description:
            "Delivers rapid, to-the-point feedback with minimal elaboration, emphasizing efficiency and self-correction",
    },
];

const ResponseStyleSelector = ({ value, onValueChange }) => {
    const [open, setOpen] = useState(false);
    const [hoveredStyle, setHoveredStyle] = useState(null);

    useEffect(() => {
        if (!open) setHoveredStyle(null);
    }, [open]);

    const selectedStyle = RESPONSE_STYLES.find((style) => style.value === value) || RESPONSE_STYLES[0];
    const styleToDisplay = hoveredStyle || selectedStyle;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-32 justify-between">
                    {selectedStyle.label}
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-48 p-0" align="end">
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
                                    onMouseEnter={() => setHoveredStyle(style)}
                                    onMouseLeave={() => setHoveredStyle(null)}
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

                <div className="border-t p-3">
                    <p className="text-xs text-muted-foreground">{styleToDisplay.description}</p>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ResponseStyleSelector;
