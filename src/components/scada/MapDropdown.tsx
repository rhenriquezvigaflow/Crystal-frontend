import { FormControl, MenuItem, Select } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

interface MapDropdownOption {
  id: string;
  label: string;
  title: string | null;
}

interface Props {
  options: MapDropdownOption[];
  activeIndex: number;
  onActiveMapIndexChange: (nextIndex: number) => void;
}

const MAP_MENU_PROPS = {
  anchorOrigin: {
    vertical: "bottom" as const,
    horizontal: "right" as const,
  },
  transformOrigin: {
    vertical: "top" as const,
    horizontal: "right" as const,
  },
  PaperProps: {
    sx: {
      mt: 0.75,
      minWidth: 220,
      maxHeight: 320,
      overflowY: "auto",
      border: "1px solid #dceaf3",
      borderRadius: 2,
      boxShadow: "0 16px 32px -18px rgba(15, 23, 42, 0.34)",
      fontFamily: "Inter, system-ui, sans-serif",
      "& .MuiMenuItem-root": {
        minHeight: 36,
        px: 1.5,
        color: "#334155",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 600,
      },
      "& .MuiMenuItem-root.Mui-selected": {
        backgroundColor: "#e0f2fe",
        color: "#075985",
        fontWeight: 700,
      },
      "& .MuiMenuItem-root.Mui-selected:hover": {
        backgroundColor: "#bae6fd",
      },
    },
  },
};

export default function MapDropdown({
  options,
  activeIndex,
  onActiveMapIndexChange,
}: Props) {
  if (options.length <= 2) return null;

  const handleSelect = (event: SelectChangeEvent<string>) => {
    onActiveMapIndexChange(Number(event.target.value));
  };

  return (
    <div className="flex w-full items-center gap-2 sm:mr-3 sm:w-auto">
      <div className="scada-map-switcher__divider hidden sm:block" />

      <FormControl
        size="small"
        className="min-w-0 flex-1 sm:flex-none"
        sx={{ width: { xs: "100%", sm: 160 } }}
      >
        <Select<string>
          value={String(activeIndex)}
          onChange={handleSelect}
          displayEmpty
          MenuProps={MAP_MENU_PROPS}
          inputProps={{ "aria-label": "Select SCADA map" }}
          renderValue={(value) => options[Number(value)]?.label ?? "Select map"}
          sx={{
            height: 36,
            borderRadius: "12px",
            background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,249,252,0.98))",
            color: "#0f172a",
            fontFamily: "Inter, system-ui, sans-serif",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
            "& .MuiSelect-select": {
              minWidth: 0,
              py: 0.75,
              pl: 1.5,
              pr: "34px !important",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 12,
              fontWeight: 700,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(14, 116, 144, 0.22)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(14, 116, 144, 0.42)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(14, 116, 144, 0.52)",
              borderWidth: 1,
            },
            "&.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(14, 116, 144, 0.12)",
            },
            "& .MuiSelect-icon": {
              right: 9,
              color: "#64748b",
            },
          }}
        >
          {options.map((option, index) => (
            <MenuItem key={option.id} value={String(index)} title={option.title ?? option.label}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
