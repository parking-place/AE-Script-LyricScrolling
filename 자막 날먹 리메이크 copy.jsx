{
    var 자막날먹기_데이터 = new Object();
    자막날먹기_데이터.scriptName = "이젠 자막도 날먹하네";

    function createUI(thisObj) {
        var pal =
            thisObj instanceof Panel
                ? thisObj
                : new Window(
                      "palette",
                      자막날먹기_데이터.scriptName,
                      undefined,
                      {
                          resizeable: true,
                      }
                  );

        if (pal !== null) {
            var group = pal.add("group", undefined, "입력 그룹");
            group.orientation = "column";

            var frameGroup = pal.add("group", undefined, "프레임 입력 그룹");
            frameGroup.orientation = "column";

            var frameText = frameGroup.add(
                "StaticText",
                undefined,
                "프레임 간격"
            );

            var frameValueGroup = frameGroup.add(
                "group",
                undefined,
                "프레임 값 입력"
            );

            var frameSlider = frameValueGroup.add(
                "slider",
                undefined,
                10,
                5,
                20
            );
            frameSlider.preferredSize = [150, 20];

            var frameNum = frameValueGroup.add("edittext", undefined, "5", {
                readonly: false,
                borderless: false,
                multiline: false,
            });

            frameNum.characters = 10;
            frameNum.justify = "center";
            frameNum.preferredSize = [50, 20];

            frameNum.onChange = function () {
                var value = parseFloat(frameNum.text);
                if (isNaN(value)) {
                    value = 0; // 숫자가 아니면 0으로 변경
                }
                value = Math.min(20, Math.max(5, value)); // 범위 제한 (5~20)
                frameNum.text = value; // 입력 필드 업데이트
                frameSlider.value = value; // 슬라이더도 함께 변경
            };

            frameSlider.onChanging = function () {
                frameNum.text = Math.round(frameSlider.value); // 실시간으로 반영 (정수로 변환)
            };

            // var lineGroup = pal.add("group", undefined, "행간 그룹");
            // var lineText = lineGroup.add("StaticText", undefined, "행간");
            // lineGroup.orientation = "column";

            // var lineValueGroup = lineGroup.add(
            //     "group",
            //     undefined,
            //     "행간 값 그룹"
            // );
            // lineValueGroup.orientation = "row";

            // var lineSlider = lineValueGroup.add(
            //     "slider",
            //     undefined,
            //     200,
            //     -100,
            //     800
            // );
            // lineSlider.preferredSize = [150, 20];
            // var lineNum = lineValueGroup.add("edittext", undefined, "50", {
            //     readonly: false,
            //     borderless: false,
            //     multiline: false,
            // });

            // lineNum.characters = 200;
            // lineNum.justify = "center";
            // lineNum.preferredSize = [50, 20];

            // lineNum.onChange = function () {
            //     var value = parseFloat(lineNum.text);
            //     if (isNaN(value)) {
            //         value = 0; // 숫자가 아니면 0으로 변경
            //     }
            //     value = Math.min(800, Math.max(-100, value)); // 범위 제한 (-100~800)
            //     lineNum.text = value; // 입력 필드 업데이트
            //     lineSlider.value = value; // 슬라이더도 함께 변경
            // };

            // lineSlider.onChanging = function () {
            //     lineNum.text = Math.round(lineSlider.value); // 실시간으로 반영 (정수로 변환)
            // };

            var BtnGroup = pal.add("group", undefined, "버튼 그룹");
            BtnGroup.orientation = "row";

            var beforeClick = BtnGroup.add(
                "StaticText",
                undefined,
                "레이어는 선택함?"
            );

            var DoBtn = BtnGroup.add("button", undefined, "그럼 ㄱㄱ");

            DoBtn.onClick = function () {
                clickStartBtn(frameSlider.value);
            };

            pal.layout.layout(true);
        }

        return pal;
    }

    function clickStartBtn(frameValue) {
        app.beginUndoGroup("자막마저 날먹하는 슝좍이들");

        var comp = app.project.activeItem;

        if (comp && comp instanceof CompItem) {
            var selectedLayers = comp.selectedLayers;

            if (selectedLayers.length > 1) alert("미안... 하나만 선택해줘..");
            else if (selectedLayers.length == 1) {
                var layer = selectedLayers[0];

                if (isTextLayer(layer)) {
                    var sliderControl = layer
                        .property("Effects")
                        .addProperty("슬라이더 컨트롤");
                    sliderControl.name = "Marker Slider";

                    var textProps = layer.property("Source Text");
                    var textDocument = textProps.value;
                    var fontSize = textDocument.fontSize; // 글자 크기 (Font Size)
                    var leading = textDocument.leading; // 행간 (Line Spacing)

                    var markers = layer.property("Marker");

                    if (markers.numKeys > 0) {
                        markerKeyframe(
                            markers,
                            sliderControl,
                            frameValue,
                            comp
                        );

                        var position = layer.property("Position");
                        position.expression =
                            "var x = transform.position[0];\n" +
                            'var y = transform.position[1] - effect("Marker Slider")("슬라이더")*' +
                            leading +
                            ";\n[x,y]";

                        var duplicatedLayer = layer.duplicate();
                        duplicatedLayer.name = layer.name + " highlight";

                        createSolid(layer, comp, fontSize, duplicatedLayer);
                    } else
                        alert(layer.name + " 레이어에 마커가 없잖아 슝좍아;;");
                } else alert("텍스트 레이어로 선택해줘...");
            } else alert("아오ㅗㅗㅗㅗ 레이어 선택하고 실행하라고 써놨잖아;;");
        } else alert("아오ㅗㅗㅗㅗㅗㅗ 슝좍아 컴프조차 없잖아;;");

        app.endUndoGroup();
    }

    function isTextLayer(layer) {
        try {
            return layer.property("Source Text") !== null;
        } catch (e) {
            return false;
        }
    }

    function getTextLayerWidth(layer) {
        if (layer.property("Source Text") !== null) {
            return layer.sourceRectAtTime(layer.time, false).width;
        } else {
            return 200; // 텍스트 레이어가 아닐 경우 null 반환
        }
    }

    function markerKeyframe(markers, sliderControl, frameValue, comp) {
        var keyframeValue = 0;

        for (var i = 1; i <= markers.numKeys; i++) {
            var markerTime = markers.keyTime(i);
            sliderControl
                .property("슬라이더")
                .setValueAtTime(markerTime, keyframeValue);

            var newKeyTime = markerTime - frameValue / comp.frameRate;

            if (newKeyTime > 0) {
                if (i !== 1) {
                    sliderControl
                        .property("슬라이더")
                        .setValueAtTime(newKeyTime, keyframeValue - 1);
                }
            }

            keyframeValue += 1;
        }
    }

    function createSolid(layer, comp, fontSize, duplicatedLayer) {
        // alert(width);

        var width = getTextLayerWidth(layer);
        var posX = layer.property("Position").value[0];

        if (!comp || !(comp instanceof CompItem)) {
            alert("활성화된 컴포지션이 없습니다!");
            return;
        }
        try {
            var solidLayer = comp.layers.addSolid(
                [0, 0, 0], // 검은색
                "Text Background",
                Math.round(width + 50),
                800,
                1.0
            );

            var solidLayer2 = comp.layers.addSolid(
                [1, 1, 1], // 흰색
                "Text Background highlight",
                Math.round(width + 50),
                Math.round(fontSize * 1.5),
                1.0
            );

            var solidPos = solidLayer.property("Position").value;
            solidLayer.property("Position").setValue([posX, solidPos[1]]);

            var solidPos2 = solidLayer2.property("Position").value;
            solidLayer2.property("Position").setValue([posX, solidPos2[1]]);

            var opacityProperty = solidLayer.property("Opacity");
            opacityProperty.setValue(60);

            duplicatedLayer.moveToBeginning();
            layer.moveToBeginning();

            layer.setTrackMatte(solidLayer2, TrackMatteType.ALPHA);
            duplicatedLayer.setTrackMatte(solidLayer, TrackMatteType.ALPHA);

            solidLayer.enabled = true;
            solidLayer2.enabled = true;

            // duplicatedLayer.trackMatteType = TrackMatteType.ALPHA;
            // duplicatedLayer.trackMatteLayer = solidLayer2;
        } catch (err) {
            alert("addSolid() 실행 중 오류 발생: " + err.message);
        }
    }

    var script = createUI(this);
    if (script instanceof Window) {
        script.center();
        script.show();
    }
}
