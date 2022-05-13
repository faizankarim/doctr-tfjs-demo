// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.

import { Box, makeStyles, Theme, Typography } from "@material-ui/core";
import Uploader from "./Uploader";
import { UploadedFile } from "../common/types";

import placeholder from "../assets/image-placeholder.svg";
import { FONTS } from "@mindee/web-elements.assets";
import { Spinner } from "@mindee/web-elements.ui.spinner";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    height: "100%",
  },
  image: {
    height: 200,
    width: "100%",
    objectFit: "contain",
  },
  placeholder: {
    height: 100,
    borderRadius: 8,
    objectFit: "contain",
    cursor: "pointer",
  },
}));

interface Props {
  loadingImage: boolean;
  onClick: () => void;
}

export default function ImageViewer({
                                        onClick,
  loadingImage,
}: Props): JSX.Element {
  const classes = useStyles();
  return (
    <Box className={classes.wrapper}>

      <button onClick={onClick}>
          predict
      </button>
    </Box>
  );
}
