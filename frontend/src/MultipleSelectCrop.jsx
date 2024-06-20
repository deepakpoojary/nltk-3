// import React, { useState } from "react";

// const CropSelector = () => {
//   const [selectedCrops, setSelectedCrops] = useState("");

//   const crops = [
//     "Wheat",
//     "Rice",
//     "Maize",
//     "Barley",
//     "Soybean",
//     "Sugarcane",
//     "Cotton",
//     "Millet",
//     "Sorghum",
//     "Pulses",
//   ];

//   const handleChange = (e) => {
//     const value = Array.from(
//       e.target.selectedOptions,
//       (option) => option.value
//     );
//     setSelectedCrops(value);
//   };

//   return (
//     <div>
//       <label htmlFor="crops">Choose crops:</label>
//       <select
//         name="crops"
//         id="crops"
//         multiple={true}
//         value={selectedCrops}
//         onChange={handleChange}
//       >
//         <option value="" disabled>
//           Select a state
//         </option>
//         {crops.map((crop, index) => (
//           <option key={index} value={crop}>
//             {crop}
//           </option>
//         ))}
//       </select>
//       {/* <br />
//       <br />
//       <p>Selected Crops: {selectedCrops.join(", ")}</p> */}
//     </div>
//   );
// };

// export default CropSelector;

// import * as React from "react";
// import { useTheme } from "@mui/material/styles";
// import OutlinedInput from "@mui/material/OutlinedInput";
// import InputLabel from "@mui/material/InputLabel";
// import MenuItem from "@mui/material/MenuItem";
// import FormControl from "@mui/material/FormControl";
// import Select from "@mui/material/Select";

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const MenuProps = {
//   PaperProps: {
//     style: {
//       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
//       width: 200,
//     },
//   },
// };

// const names = [
//   "Wheat",
//   "Rice",
//   "Maize",
//   "Barley",
//   "Soybean",
//   "Sugarcane",
//   "Cotton",
//   "Millet",
//   "Sorghum",
//   "Pulses",
// ];

// function getStyles(name, personName, theme) {
//   return {
//     fontWeight:
//       personName.indexOf(name) === -1
//         ? theme.typography.fontWeightRegular
//         : theme.typography.fontWeightMedium,
//   };
// }

// export default function MultipleSelectCrop() {
//   const theme = useTheme();
//   const [personName, setPersonName] = React.useState([]);

//   const handleChange = (event) => {
//     const {
//       target: { value },
//     } = event;
//     setPersonName(
//       // On autofill we get a stringified value.
//       typeof value === "string" ? value.split(",") : value
//     );
//   };

//   return (
//     <div>
//       <FormControl sx={{ m: 1, width: 300 }}>
//         <InputLabel id="demo-multiple-name-label">Select Crops</InputLabel>
//         <Select
//           labelId="demo-multiple-name-label"
//           id="demo-multiple-name"
//           multiple
//           value={personName}
//           onChange={handleChange}
//           input={<OutlinedInput label="Name" />}
//           MenuProps={MenuProps}
//         >
//           {names.map((name) => (
//             <MenuItem
//               key={name}
//               value={name}
//               style={getStyles(name, personName, theme)}
//             >
//               {name}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//     </div>
//   );
// }
import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const cropsList = [
  "Wheat",
  "Rice",
  "Corn",
  "Barley",
  "Soybean",
  "Sugarcane",
  // Add more crops as needed
];

const CropSelector = ({ selectedCrops, handleChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="crop-select-label">Select Crops</InputLabel>
      <Select
        labelId="crop-select-label"
        id="crop-select"
        multiple
        name="Crops"
        value={selectedCrops}
        onChange={handleChange}
        label="Select Crops"
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 48 * 6 + 8, // ITEM_HEIGHT * 6 + ITEM_PADDING_TOP
              width: 250,
            },
          },
        }}
      >
        {cropsList.map((crop, index) => (
          <MenuItem key={index} value={crop}>
            {crop}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

CropSelector.propTypes = {
  selectedCrops: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default CropSelector;
