// import React, { useState } from "react";

// const StateSelector = () => {
//   const [selectedState, setSelectedState] = useState("");

//   const statesOfIndia = [
//     "Andhra Pradesh",
//     "Arunachal Pradesh",
//     "Assam",
//     "Bihar",
//     "Chhattisgarh",
//     "Goa",
//     "Gujarat",
//     "Haryana",
//     "Himachal Pradesh",
//     "Jharkhand",
//     "Karnataka",
//     "Kerala",
//     "Madhya Pradesh",
//     "Maharashtra",
//     "Manipur",
//     "Meghalaya",
//     "Mizoram",
//     "Nagaland",
//     "Odisha",
//     "Punjab",
//     "Rajasthan",
//     "Sikkim",
//     "Tamil Nadu",
//     "Telangana",
//     "Tripura",
//     "Uttar Pradesh",
//     "Uttarakhand",
//     "West Bengal",
//   ];

//   const handleChange = (e) => {
//     setSelectedState(e.target.value);
//   };

//   return (
//     <div>
//       <label htmlFor="states">Choose a state:</label>
//       <select
//         name="states"
//         id="states"
//         value={selectedState}
//         onChange={handleChange}
//       >
//         <option value="" disabled>
//           Select a state
//         </option>
//         {statesOfIndia.map((state, index) => (
//           <option key={index} value={state}>
//             {state}
//           </option>
//         ))}
//       </select>
//       {/* <br /> */}
//       {/* <br /> */}
//       {/* <p>Selected State: {selectedState}</p> */}
//     </div>
//   );
// };

// export default StateSelector;

// import * as React from "react";
// import Box from "@mui/material/Box";
// import InputLabel from "@mui/material/InputLabel";
// import MenuItem from "@mui/material/MenuItem";
// import FormControl from "@mui/material/FormControl";
// import Select from "@mui/material/Select";
// import PropTypes from "prop-types";

// const ITEM_HEIGHT = 48;
// const ITEM_PADDING_TOP = 8;
// const statesOfIndia = [
//   "Andhra Pradesh",
//   "Arunachal Pradesh",
//   "Assam",
//   "Bihar",
//   "Chhattisgarh",
//   "Goa",
//   "Gujarat",
//   "Haryana",
//   "Himachal Pradesh",
//   "Jharkhand",
//   "Karnataka",
//   "Kerala",
//   "Madhya Pradesh",
//   "Maharashtra",
//   "Manipur",
//   "Meghalaya",
//   "Mizoram",
//   "Nagaland",
//   "Odisha",
//   "Punjab",
//   "Rajasthan",
//   "Sikkim",
//   "Tamil Nadu",
//   "Telangana",
//   "Tripura",
//   "Uttar Pradesh",
//   "Uttarakhand",
//   "West Bengal",
//   "Andaman and Nicobar Islands",
//   "Chandigarh",
//   "Dadra and Nagar Haveli and Daman and Diu",
//   "Lakshadweep",
//   "Delhi",
//   "Puducherry",
// ];
// // const
// const StateSelector = ({ selectedState, handleChange }) => {
//   //   const [selectedState, setSelectedState] = React.useState("");

//   //   const handleChange = (event) => {
//   //     setSelectedState(event.target.value);
//   //   };

//   return (
//     <Box sx={{ minWidth: 250 }}>
//       <FormControl fullWidth>
//         <InputLabel id="demo-simple-select-label">Select State</InputLabel>
//         <Select
//           labelId="demo-simple-select-label"
//           id="demo-simple-select"
//           value={selectedState}
//           label="Select State"
//           onChange={handleChange}
//           MenuProps={{
//             PaperProps: {
//               style: {
//                 maxHeight: 48 * 6 + 8, // ITEM_HEIGHT * 6 + ITEM_PADDING_TOP
//                 width: 250,
//               },
//             },
//           }}
//         >
//           {statesOfIndia.map((state, index) => (
//             <MenuItem key={index} value={state}>
//               {state}
//             </MenuItem>
//           ))}
//         </Select>
//       </FormControl>
//     </Box>
//   );
// };
// StateSelector.propTypes = {
//   selectedState: PropTypes.string.isRequired,
//   handleChange: PropTypes.func.isRequired,
// };

// export default StateSelector;

import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

const statesOfIndia = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
  "Delhi",
  "Puducherry",
];

const StateSelector = ({ selectedState, handleChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="state-select-label">Select State</InputLabel>
      <Select
        labelId="state-select-label"
        id="state-select"
        name="State"
        value={selectedState}
        onChange={handleChange}
        label="Select State"
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 48 * 6 + 8, // ITEM_HEIGHT * 6 + ITEM_PADDING_TOP
              width: 250,
            },
          },
        }}
      >
        {statesOfIndia.map((state, index) => (
          <MenuItem key={index} value={state}>
            {state}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

StateSelector.propTypes = {
  selectedState: PropTypes.string.isRequired,
  handleChange: PropTypes.func.isRequired,
};

export default StateSelector;

