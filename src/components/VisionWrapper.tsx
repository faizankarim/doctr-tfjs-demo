// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.

import {Grid, makeStyles, Portal, Theme} from "@material-ui/core";
import {GraphModel} from "@tensorflow/tfjs";
import {createRef, useEffect, useMemo, useRef, useState} from "react";
import {
    AnnotationData,
    AnnotationShape,
    drawLayer,
    drawShape,
    setShapeConfig,
    Stage,
} from "react-mindee-js";
import Webcam from "react-webcam";
import {DET_CONFIG, RECO_CONFIG} from "src/common/constants";
import {
    extractBoundingBoxesFromHeatmap,
    extractWords,
    getHeatMapFromImage,
    loadDetectionModel,
    loadRecognitionModel,
} from "src/utils";
import {useStateWithRef} from "src/utils/hooks";
import {flatten} from "underscore";
import {UploadedFile, Word} from "../common/types";
import AnnotationViewer from "./AnnotationViewer";
import HeatMap from "./HeatMap";
import ImageViewer from "./ImageViewer";
import Sidebar from "./Sidebar";
import WordsList from "./WordsList";

const COMPONENT_ID = "VisionWrapper";

const useStyles = makeStyles((theme: Theme) => ({
    wrapper: {},
}));

export default function VisionWrapper(): JSX.Element {
    const classes = useStyles();
    const [detConfig, setDetConfig] = useState(DET_CONFIG.db_mobilenet_v2);
    const [recoConfig, setRecoConfig] = useState(RECO_CONFIG.crnn_vgg16_bn);
    const [loadingImage, setLoadingImage] = useState(false);
    const recognitionModel = useRef<GraphModel | null>(null);
    const detectionModel = useRef<GraphModel | null>(null);
    const imageObject = useRef<HTMLImageElement>(new Image());
    const heatMapContainerObject = useRef<HTMLCanvasElement | null>(null);
    const annotationStage = useRef<Stage | null>();
    const [extractingWords, setExtractingWords] = useState(false);
    const [annotationData, setAnnotationData] = useState<AnnotationData>({
        image: null,
    });
    const fieldRefsObject = useRef<any[]>([]);
    const [words, setWords, wordsRef] = useStateWithRef<Word[]>([]);

    const clearCurrentStates = () => {
        setWords([]);
    };

    const onUpload = (newFile: UploadedFile) => {
        clearCurrentStates();
        // loadImage(newFile);
        setAnnotationData({image: newFile.image});
    };

    useEffect(() => {
        setWords([]);
        setAnnotationData({image: null});
        imageObject.current.src = "";
        if (heatMapContainerObject.current) {
            const context = heatMapContainerObject.current.getContext("2d");
            context?.clearRect(
                0,
                0,
                heatMapContainerObject.current.width,
                heatMapContainerObject.current.height
            );
        }
        loadRecognitionModel({recognitionModel, recoConfig});
    }, [recoConfig]);

    useEffect(() => {
        setWords([]);
        setAnnotationData({image: null});
        imageObject.current.src = "";
        if (heatMapContainerObject.current) {
            const context = heatMapContainerObject.current.getContext("2d");
            context?.clearRect(
                0,
                0,
                heatMapContainerObject.current.width,
                heatMapContainerObject.current.height
            );
        }
        loadDetectionModel({detectionModel, detConfig});
    }, [detConfig]);

    const getBoundingBoxes = () => {
        const boundingBoxes = extractBoundingBoxesFromHeatmap([
            detConfig.height,
            detConfig.width,
        ]);
        setAnnotationData({
            image: imageObject.current.src,
            shapes: boundingBoxes,
        });
        setTimeout(getWords, 1000);
    };

    const getWords = async () => {
        const words = (await extractWords({
            recognitionModel: recognitionModel.current,
            stage: annotationStage.current!,
            size: [recoConfig.height, recoConfig.width],
        })) as Word[];
        setWords(flatten(words));
        setExtractingWords(false);
    };

    const videoConstraints = {
        width: 512,
        height: 512,
        facingMode: "environment"
    };

    const WebcamCapture = () => (
        <Webcam
            audio={false}
            height={512}
            screenshotFormat="image/jpeg"
            width={512}
            videoConstraints={videoConstraints}
        >
            {({ getScreenshot }) => (
                <button
                    onClick={() => {
                        const imageSrc = getScreenshot();
                        if (typeof imageSrc === "string") {
                            imageObject.current.src = imageSrc;
                            imageObject.current.onload = async () => {
                                await getHeatMapFromImage({
                                    heatmapContainer: heatMapContainerObject.current,
                                    detectionModel: detectionModel.current,
                                    imageObject: imageObject.current,
                                    size: [detConfig.height, detConfig.width],
                                });
                                getBoundingBoxes();
                                setLoadingImage(false);
                            };

                        }
                    }}
                >
                    Capture photo
                </button>
            )}
        </Webcam>
    );

    // function delay() {
    //     return new Promise(resolve => setTimeout(resolve, 1000));
    // }
    //
    // // get usermedia stream and set it to the image object and set setExtractingWords to true and get the bounding boxes and words
    // const getUserMedia = async() => {
    //     setExtractingWords(true);
    //     const video = document.createElement("video");
    //     const canvas = document.createElement("canvas");
    //     const context = canvas.getContext("2d");
    //     const stream = navigator.mediaDevices.getUserMedia({
    //         audio: false,
    //         video: {
    //             facingMode: "environment",
    //         },
    //     });
    //     video.srcObject = await stream;
    //     video.play();
    //     video.addEventListener("loadedmetadata", () => {
    //         canvas.width = video.videoWidth;
    //         canvas.height = video.videoHeight;
    //         context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    //         imageObject.current.src = canvas.toDataURL("image/png");
    //         imageObject.current.onload = async () => {
    //             await getHeatMapFromImage({
    //                 heatmapContainer: heatMapContainerObject.current,
    //                 detectionModel: detectionModel.current,
    //                 imageObject: imageObject.current,
    //                 size: [detConfig.height, detConfig.width],
    //             });
    //             getBoundingBoxes();
    //             setLoadingImage(false);
    //         };
    //     });
    //     delay().then(() => console.log('ran after 1 second1 passed'));
    //     getUserMedia();
    // };

    // const loadImage = async (uploadedFile: UploadedFile) => {
    //     setLoadingImage(true);
    //     setExtractingWords(true);
    //     imageObject.current.onload = async () => {
    //         await getHeatMapFromImage({
    //             heatmapContainer: heatMapContainerObject.current,
    //             detectionModel: detectionModel.current,
    //             imageObject: imageObject.current,
    //             size: [detConfig.height, detConfig.width],
    //         });
    //         getBoundingBoxes();
    //         setLoadingImage(false);
    //     };
    //     imageObject.current.src = uploadedFile?.image as string;
    // };
    const setAnnotationStage = (stage: Stage) => {
        annotationStage.current = stage;
    };

    const onFieldMouseLeave = (word: Word) => {
        drawShape(annotationStage.current!, word.id, {
            fill: `${word.color}33`,
        });
    };
    const onFieldMouseEnter = (word: Word) => {
        setShapeConfig(annotationStage.current!, word.id, {
            fill: "transparent",
        });

        drawLayer(annotationStage.current!);
    };
    const onShapeMouseEnter = (shape: AnnotationShape) => {
        const newWords = [...wordsRef.current];
        const fieldIndex = newWords.findIndex((word) => word.id === shape.id);
        if (fieldIndex >= 0) {
            newWords[fieldIndex].isActive = true;
            setWords(newWords);
        }
    };
    const onShapeMouseLeave = (shape: AnnotationShape) => {
        const newWords = [...wordsRef.current];
        const fieldIndex = newWords.findIndex((word) => word.id === shape.id);
        if (fieldIndex >= 0) {
            newWords[fieldIndex].isActive = false;
            setWords(newWords);
        }
    };
    fieldRefsObject.current = useMemo(
        () => words.map((word) => createRef()),
        [words]
    );
    const onShapeClick = (shape: AnnotationShape) => {
        const fieldIndex = wordsRef.current.findIndex(
            (word) => word.id === shape.id
        );

        if (fieldIndex >= 0) {
            fieldRefsObject.current[fieldIndex]?.current?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };
    const uploadContainer = document.getElementById("upload-container");
    return (
        <Grid
            spacing={3}
            className={classes.wrapper}
            item
            id={COMPONENT_ID}
            container
        >
            {/*<Portal container={uploadContainer}>*/}
            {/*    /!*<ImageViewer loadingImage={loadingImage} onClick={getUserMedia}/>*!/*/}

            {/*</Portal>*/}

            {/*<button/>*/}
            <HeatMap heatMapContainerRef={heatMapContainerObject}/>
            <Grid item xs={12} md={3}>
                <Sidebar
                    detConfig={detConfig}
                    setDetConfig={setDetConfig}
                    recoConfig={recoConfig}
                    setRecoConfig={setRecoConfig}
                />
            </Grid>
            <WebcamCapture/>
            <Grid xs={12} item md={5}>
                <AnnotationViewer
                    loadingImage={loadingImage}
                    setAnnotationStage={setAnnotationStage}
                    annotationData={annotationData}
                    onShapeMouseEnter={onShapeMouseEnter}
                    onShapeMouseLeave={onShapeMouseLeave}
                    onShapeClick={onShapeClick}
                />
            </Grid>
            <Grid xs={12} item md={4}>
                <WordsList
                    fieldRefsObject={fieldRefsObject.current}
                    onFieldMouseLeave={onFieldMouseLeave}
                    onFieldMouseEnter={onFieldMouseEnter}
                    extractingWords={extractingWords}
                    words={words}
                />
            </Grid>
        </Grid>
    );
}
