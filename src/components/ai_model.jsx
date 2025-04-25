// No longer used
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@components/ui/command";
import { Button } from "@components/ui/button";

const MODELS = [
    {
        value: "gpt-4o",
        label: "gpt-4o",
        description: "Thorough and detailed, best for deep explanations and complex problem breakdowns",
    },
    {
        value: "o3-mini",
        label: "o3-mini",
        description: "Exceptional STEM capabilities, best for debugging and code assistance",
    },
];

const ModelSelector = ({ value, onValueChange }) => {
    const [open, setOpen] = useState(false);
    const [hoveredModel, setHoveredModel] = useState(null);

    useEffect(() => {
        if (!open) setHoveredModel(null);
    }, [open]);

    const selectedModel = MODELS.find((model) => model.value === value) || MODELS[0];
    const modelToDisplay = hoveredModel || selectedModel;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-32 justify-between">
                    {selectedModel.label}
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-48 p-0" align="end">
                <Command>
                    <CommandList>
                        <CommandEmpty>No models found.</CommandEmpty>
                        <CommandGroup>
                            {MODELS.map((model) => (
                                <CommandItem
                                    key={model.value}
                                    value={model.value}
                                    onSelect={() => {
                                        onValueChange(model.value);
                                        setOpen(false);
                                    }}
                                    onMouseEnter={() => setHoveredModel(model)}
                                    onMouseLeave={() => setHoveredModel(null)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>{model.label}</span>
                                        {value === model.value && <Check className="h-3 w-3 text-primary" />}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>

                <div className="border-t p-3">
                    <p className="text-xs text-muted-foreground">{modelToDisplay.description}</p>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ModelSelector;