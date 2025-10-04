"use client"

import * as React from "react"
import { countries } from "country-data-list"
import { CircleFlag } from "react-circle-flags"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Country = {
  value: string
  label: string
  flag: string
}

const countryList: Country[] = countries.all
  .filter((country) => country.alpha2 && country.name)
  .map((country) => ({
    value: country.alpha2,
    label: country.name,
    flag: country.alpha2,
  }))

export function CountryDropdown({
  value,
  onChange,
  placeholder = "Select a country",
}: {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <div className="flex items-center">
              <CircleFlag countryCode={value.toLowerCase()} className="w-4 h-4 mr-2" />
              {countryList.find((country) => country.value === value)?.label}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countryList.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={(currentValue) => {
                    const countryValue = countryList.find(c => c.label.toLowerCase() === currentValue.toLowerCase())?.value || ""
                    onChange(countryValue)
                    setOpen(false)
                  }}
                >
                  <CircleFlag
                    countryCode={country.flag.toLowerCase()}
                    className="w-4 h-4 mr-2"
                  />
                  {country.label}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === country.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
