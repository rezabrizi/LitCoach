import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@components/ui/command";
import { Button } from "@components/ui/button";

const RESPONSE_STYLES = [
    {
        value: "normal",
        label: "Normal",
        description: "Helpful guidance with explanations",
        details: [
            "Analyzes code for errors and inefficiencies",
            "Provides clear explanations and hints",
            "Encourages independent problem-solving",
            "Gives full solutions only if explicitly requested",
        ],
    },
    {
        value: "interview",
        label: "Interview",
        description: "Simulates a real technical interview",
        details: [
            "Minimal guidance; provides hints only when asked",
            "Does not reveal algorithm names unless requested repeatedly",
            "Never reveals complete solutions",
            "Asks follow-up questions about complexity and optimizations",
        ],
    },
    {
        value: "concise",
        label: "Concise",
        description: "Direct, bullet-pointed guidance",
        details: [
            "Very short responses with minimal explanation",
            "Quick feedback with only essential details",
            "Confirms correct solutions efficiently",
            "Avoids unnecessary elaboration",
        ],
    },
];

const ResponseStyleSelector = ({ value = "normal", onValueChange }) => {
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
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-40 justify-between">
                    {selectedStyle.label}
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0" align="end">
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

                <StyleDescription style={styleToDisplay} />
            </PopoverContent>
        </Popover>
    );
};

const StyleDescription = ({ style }) => (
    <div className="border-t p-3">
        <div className="mb-2">
            <h3 className="font-medium text-sm">{style.label}</h3>
            <p className="text-xs text-muted-foreground">{style.description}</p>
        </div>
        <div>
            <h4 className="text-xs font-medium mb-1 text-muted-foreground">WHAT TO EXPECT</h4>
            <ul className="text-xs space-y-1">
                {style.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-1.5">
                        <span className="text-primary text-xs">•</span>
                        <span>{detail}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

export default ResponseStyleSelector;
