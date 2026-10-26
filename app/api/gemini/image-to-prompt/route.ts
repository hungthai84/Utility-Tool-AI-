import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { ai } from '@/lib/gemini';

const MODEL_NAME = 'gemini-3.8-flash';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Bạn có thể kiểm tra khóa API trong phần Settings > Secrets.',
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. TINH CHỈNH PROMPT SAU PHÂN TÍCH (BƯỚC 9)
    if (action === 'refine_prompt') {
      const {
        currentPrompt,
        analysisSummary,
        refinementType,
        customInstruction,
        outputLanguage,
      } = body;

      const refineDirectives: Record<string, string> = {
        expand_details:
          'Viết lại prompt chi tiết hơn, làm rõ kết cấu bề mặt, phân lớp không gian, hướng sáng và màu sắc mà không thêm vật thể lạ.',
        shorten:
          'Rút gọn prompt thành phiên bản cô đọng nhất, chỉ giữ lại chủ thể chính, bố cục, ánh sáng và phong cách cốt lõi.',
        increase_fidelity:
          'Tăng cường tối đa các ràng buộc độ trung thực (Fidelity Constraints): giữ đúng số lượng chủ thể, vị trí tương đối, tỷ lệ và bảng màu gốc.',
        focus_lighting:
          'Tập trung làm nổi bật hệ thống ánh sáng (Key light, Fill light, Rim light, bóng đổ, phản chiếu và độ tương phản).',
        focus_materials:
          'Tập trung mô tả sâu chất liệu và kết cấu bề mặt (độ nhám, độ bóng, phản xạ, vải, kim loại, kính, da...).',
        focus_composition:
          'Tập trung mô tả sâu bố cục khung hình, tiền/trung/hậu cảnh, khoảng trống âm, góc máy và độ sâu trường ảnh.',
        highlight_subject:
          'Đặt trọng tâm mô tả sắc nét vào chủ thể chính, tư thế, hình dáng và đặc điểm nhận diện nổi bật.',
        reduce_secondary:
          'Giảm bớt các chi tiết phụ ở hậu cảnh để tập trung hoàn toàn vào chủ thể chính.',
        remove_text:
          'Loại bỏ toàn bộ yêu cầu sinh chữ/văn bản mới; giữ vùng không gian âm sạch sẽ không có chữ hay watermark.',
        change_palette:
          'Giữ nguyên 100% bố cục và chủ thể nhưng điều chỉnh bảng màu theo yêu cầu bổ sung.',
        change_style:
          '[Chế độ biến đổi phong cách] Giữ nguyên bố cục và chủ thể nhưng chuyển đổi phong cách nghệ thuật theo yêu cầu.',
      };

      const instruction = refineDirectives[refinementType] || customInstruction || 'Tối ưu hóa prompt rõ ràng và chính xác hơn.';
      const langNote =
        outputLanguage === 'vi'
          ? 'Trả về prompt bằng Tiếng Việt chuẩn thuật ngữ thị giác.'
          : 'Return the refined prompt in clear, precise visual English.';

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Bạn là Chuyên gia Prompt Engineering & Thị giác máy tính.
Tóm tắt phân tích ảnh gốc: ${analysisSummary || 'Không có'}
Prompt hiện tại:
"""
${currentPrompt}
"""
Yêu cầu tinh chỉnh: ${instruction}
${customInstruction ? `Chỉ dẫn bổ sung của người dùng: ${customInstruction}` : ''}
${langNote}
Tuyệt đối không bịa thêm vật thể trái ngược với phân tích ảnh gốc.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedPrompt: { type: Type.STRING },
              changeNote: { type: Type.STRING },
            },
            required: ['refinedPrompt', 'changeNote'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json(parsed);
    }

    // 2. PHÂN TÍCH TỔNG HỢP & SO SÁNH THEO LÔ NHIỀU ẢNH (BƯỚC 11.4)
    if (action === 'batch_synthesize') {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Danh sách ảnh cần tổng hợp đang trống.' },
          { status: 400 }
        );
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Bạn là Chuyên gia Phân tích Thị giác & Prompt Architect.
Dưới đây là kết quả phân tích của ${items.length} hình ảnh trong cùng một lô (Batch):
${JSON.stringify(items, null, 2)}

Hãy phân tích so sánh và tổng hợp bằng Tiếng Việt (riêng representativeMasterPrompt viết bằng tiếng Anh chuẩn):
1. Phong cách thị giác chung của nhóm ảnh (commonVisualStyle).
2. Bảng màu chung xuất hiện xuyên suốt (sharedColorPalette).
3. Các mẫu bố cục lặp lại (recurringCompositionPatterns).
4. Những điểm tương đồng chính (keySimilarities).
5. Những điểm khác biệt chính giữa các ảnh (keyDifferences).
6. Một Prompt đại diện cho phong cách chung của cả bộ ảnh (representativeMasterPrompt).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              commonVisualStyle: { type: Type.STRING },
              sharedColorPalette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recurringCompositionPatterns: { type: Type.STRING },
              keySimilarities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              keyDifferences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              representativeMasterPrompt: { type: Type.STRING },
            },
            required: [
              'commonVisualStyle',
              'sharedColorPalette',
              'recurringCompositionPatterns',
              'keySimilarities',
              'keyDifferences',
              'representativeMasterPrompt',
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({
        analyzedCount: items.length,
        ...parsed,
      });
    }

    // 3. PHÂN TÍCH HÌNH ẢNH THỰC TẾ ĐA CẤP ĐỘ & TẠO STRUCTURED PROMPT (BƯỚC 3 -> BƯỚC 10)
    const {
      base64Data,
      mimeType,
      fileName,
      width,
      height,
      analysisMode,
      targetTool,
      outputLanguage,
      detailLevel,
      templateDirective,
      noNewTextBanner,
      textHandlingPolicy,
      estimatedHexList,
      exactPixelRatio,
      nearestStandardRatio,
    } = body;

    if (!base64Data || !mimeType) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu hình ảnh đầu vào để phân tích.' },
        { status: 400 }
      );
    }

    const systemPrompt = `Bạn là Chuyên gia Phân tích Thị giác Máy tính (Computer Vision Specialist) và Kỹ sư Prompt (Prompt Engineer) cấp cao.
Nhiệm vụ của bạn là phân tích HÌNH ẢNH THỰC TẾ được đính kèm và tạo báo cáo phân tích thị giác 10 cấp độ cùng bộ Prompt tái hiện hình ảnh chuẩn xác.

THÔNG TIN KỸ THUẬT ĐÃ XÁC MINH TỪ PIXEL ẢNH:
- Tên tệp: ${fileName}
- Kích thước gốc: ${width}×${height}px (Tỷ lệ chính xác: ${exactPixelRatio}, Tỷ lệ chuẩn gần nhất: ${nearestStandardRatio})
- Bảng mã màu HEX ước lượng từ pixel ảnh: ${estimatedHexList || 'Trích xuất từ ảnh'}
- Chế độ phân tích yêu cầu (Analysis Mode): ${analysisMode}
- Công cụ AI mục tiêu (Target Tool): ${targetTool}
- Mức độ chi tiết: ${detailLevel}
- Ngôn ngữ đầu ra yêu cầu: ${outputLanguage}
- Chính sách xử lý chữ trên ảnh: ${textHandlingPolicy || 'keep_exact'} ${
      noNewTextBanner ? '(BẮT BUỘC: Không yêu cầu mô hình tạo chữ mới trên banner)' : ''
    }
${templateDirective ? `- Định hướng Template: ${templateDirective}` : ''}

NGUYÊN TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM):
1. Chỉ mô tả những gì THỰC SỰ XUẤT HIỆN trong hình ảnh đính kèm.
2. Phân biệt rõ: Quan sát trực tiếp (directlyObserved), Suy luận có cơ sở (reasonableInferences), và Chưa đủ dữ liệu để kết luận (insufficientDataToConclude).
3. KHÔNG tự ý thêm vật thể, KHÔNG thay đổi trang phục, tư thế, số lượng chủ thể, màu sắc hoặc bố cục.
4. KHÔNG suy đoán danh tính cá nhân, nghề nghiệp hoặc thông số máy ảnh/tiêu cự cụ thể khi không có căn cứ.
5. Nếu ảnh có chữ (visibleText): trích xuất đúng chính tả những chữ đọc được rõ, ghi nhận ngôn ngữ, vị trí, phân cấp chữ, màu sắc; không bịa nội dung chữ bị mờ/che khuất.
6. Nếu chế độ là "ui_screenshot" (Mode 7): phải phân tích kỹ cấu trúc Layout, Header, Sidebar, Card, Grid, khoảng cách, Typography, màu nền/chữ, Border, Shadow và Radius trong trường uiLayoutDetails.
7. Nếu chế độ là "banner_design" (Mode 8): phải phân tích rõ vị trí chủ thể và khoảng trống dành cho tiêu đề (Copy Space) trong trường bannerCopySpace.
8. Tạo đầy đủ các phiên bản Prompt:
   - faithfulPrompt (Version A: Tái hiện sát ảnh gốc nhất, cụ thể, giàu thông tin thị giác, kèm Fidelity Constraints phù hợp).
   - detailedPrompt (Version B: Ultra-Detailed mô tả sâu bố cục, ánh sáng, chất liệu, màu sắc).
   - concisePrompt (Version C: Ngắn gọn, cô đọng các yếu tố cốt lõi).
   - editableBlocks (Version D: Chia thành 8 khối chủ thể, môi trường, bố cục, ánh sáng, màu sắc, phong cách, tỷ lệ, ràng buộc).
   - creativeVariationPrompt (Version E: Biến thể sáng tạo có kiểm soát, ghi rõ sự khác biệt với bản trung thành).
   - negativePrompt (Các yếu tố cần tránh phù hợp riêng với ảnh này).
   - vietnamesePrompt (Bản Prompt hoàn chỉnh bằng Tiếng Việt chuẩn thuật ngữ thị giác).
   - englishPrompt (Bản Prompt hoàn chỉnh bằng Tiếng Anh chuẩn quốc tế).`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType,
          },
        },
        {
          text: systemPrompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sceneType: { type: Type.STRING },
            visualPurpose: { type: Type.STRING },
            dominantElement: { type: Type.STRING },
            detailDensity: { type: Type.STRING },
            subjects: {
              type: Type.OBJECT,
              properties: {
                count: { type: Type.STRING },
                primaryDescription: { type: Type.STRING },
                positionInFrame: { type: Type.STRING },
                scaleRatio: { type: Type.STRING },
                poseAndAction: { type: Type.STRING },
                orientationAndGaze: { type: Type.STRING },
                subjectRelationships: { type: Type.STRING },
                distinctiveFeatures: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'count',
                'primaryDescription',
                'positionInFrame',
                'scaleRatio',
                'poseAndAction',
                'orientationAndGaze',
                'subjectRelationships',
                'distinctiveFeatures',
              ],
            },
            composition: {
              type: Type.OBJECT,
              properties: {
                overallStructure: { type: Type.STRING },
                foregroundMidgroundBackground: { type: Type.STRING },
                negativeSpace: { type: Type.STRING },
                visualBalanceAndFocalPoint: { type: Type.STRING },
                eyeLeadingLines: { type: Type.STRING },
                subjectToBackgroundRatio: { type: Type.STRING },
                uiLayoutDetails: { type: Type.STRING },
                bannerCopySpace: { type: Type.STRING },
              },
              required: [
                'overallStructure',
                'foregroundMidgroundBackground',
                'negativeSpace',
                'visualBalanceAndFocalPoint',
                'eyeLeadingLines',
                'subjectToBackgroundRatio',
              ],
            },
            cameraAndPerspective: {
              type: Type.OBJECT,
              properties: {
                shotType: { type: Type.STRING },
                cameraAngle: { type: Type.STRING },
                perspectiveType: { type: Type.STRING },
                depthOfField: { type: Type.STRING },
              },
              required: ['shotType', 'cameraAngle', 'perspectiveType', 'depthOfField'],
            },
            lighting: {
              type: Type.OBJECT,
              properties: {
                keyLightSource: { type: Type.STRING },
                fillAndRimLight: { type: Type.STRING },
                direction: { type: Type.STRING },
                softnessAndIntensity: { type: Type.STRING },
                contrastLevel: { type: Type.STRING },
                shadowsAndReflections: { type: Type.STRING },
                naturalOrArtificial: { type: Type.STRING },
              },
              required: [
                'keyLightSource',
                'fillAndRimLight',
                'direction',
                'softnessAndIntensity',
                'contrastLevel',
                'shadowsAndReflections',
                'naturalOrArtificial',
              ],
            },
            colorPalette: {
              type: Type.OBJECT,
              properties: {
                dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                secondaryColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                accentColors: { type: Type.ARRAY, items: { type: Type.STRING } },
                colorTemperature: { type: Type.STRING },
                saturationAndContrast: { type: Type.STRING },
                colorGrading: { type: Type.STRING },
                subjectBackgroundHarmony: { type: Type.STRING },
              },
              required: [
                'dominantColors',
                'secondaryColors',
                'accentColors',
                'colorTemperature',
                'saturationAndContrast',
                'colorGrading',
                'subjectBackgroundHarmony',
              ],
            },
            materialsAndTextures: {
              type: Type.OBJECT,
              properties: {
                observedMaterials: { type: Type.ARRAY, items: { type: Type.STRING } },
                surfaceCharacteristics: { type: Type.STRING },
                roughnessAndReflectivity: { type: Type.STRING },
              },
              required: [
                'observedMaterials',
                'surfaceCharacteristics',
                'roughnessAndReflectivity',
              ],
            },
            style: {
              type: Type.OBJECT,
              properties: {
                primaryStyle: { type: Type.STRING },
                secondaryTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
                realismLevel: { type: Type.STRING },
                renderingTechnique: { type: Type.STRING },
              },
              required: [
                'primaryStyle',
                'secondaryTraits',
                'realismLevel',
                'renderingTechnique',
              ],
            },
            background: {
              type: Type.OBJECT,
              properties: {
                settingDescription: { type: Type.STRING },
                backgroundObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                spatialDepth: { type: Type.STRING },
              },
              required: ['settingDescription', 'backgroundObjects', 'spatialDepth'],
            },
            visibleText: {
              type: Type.OBJECT,
              properties: {
                hasVisibleText: { type: Type.BOOLEAN },
                readableTextItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      content: { type: Type.STRING },
                      language: { type: Type.STRING },
                      position: { type: Type.STRING },
                      hierarchyRole: { type: Type.STRING },
                      typographyStyle: { type: Type.STRING },
                      colorAndAlignment: { type: Type.STRING },
                    },
                    required: [
                      'content',
                      'language',
                      'position',
                      'hierarchyRole',
                      'typographyStyle',
                      'colorAndAlignment',
                    ],
                  },
                },
                unreadableOrBlurryTextNote: { type: Type.STRING },
              },
              required: [
                'hasVisibleText',
                'readableTextItems',
                'unreadableOrBlurryTextNote',
              ],
            },
            faithfulPrompt: { type: Type.STRING },
            detailedPrompt: { type: Type.STRING },
            concisePrompt: { type: Type.STRING },
            editableBlocks: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                environment: { type: Type.STRING },
                composition: { type: Type.STRING },
                lighting: { type: Type.STRING },
                colors: { type: Type.STRING },
                style: { type: Type.STRING },
                aspectRatioAndFraming: { type: Type.STRING },
                fidelityConstraints: { type: Type.STRING },
              },
              required: [
                'subject',
                'environment',
                'composition',
                'lighting',
                'colors',
                'style',
                'aspectRatioAndFraming',
                'fidelityConstraints',
              ],
            },
            creativeVariationPrompt: { type: Type.STRING },
            negativePrompt: { type: Type.STRING },
            vietnamesePrompt: { type: Type.STRING },
            englishPrompt: { type: Type.STRING },
            confidenceAssessment: {
              type: Type.OBJECT,
              properties: {
                directlyObserved: { type: Type.ARRAY, items: { type: Type.STRING } },
                reasonableInferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                insufficientDataToConclude: { type: Type.ARRAY, items: { type: Type.STRING } },
                qualitativeConfidenceLabel: { type: Type.STRING },
              },
              required: [
                'directlyObserved',
                'reasonableInferences',
                'insufficientDataToConclude',
                'qualitativeConfidenceLabel',
              ],
            },
            uncertainties: { type: Type.ARRAY, items: { type: Type.STRING } },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'summary',
            'sceneType',
            'visualPurpose',
            'dominantElement',
            'detailDensity',
            'subjects',
            'composition',
            'cameraAndPerspective',
            'lighting',
            'colorPalette',
            'materialsAndTextures',
            'style',
            'background',
            'visibleText',
            'faithfulPrompt',
            'detailedPrompt',
            'concisePrompt',
            'editableBlocks',
            'creativeVariationPrompt',
            'negativePrompt',
            'vietnamesePrompt',
            'englishPrompt',
            'confidenceAssessment',
            'uncertainties',
            'warnings',
          ],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Image-to-Prompt API Error:', err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          'Lỗi khi gọi mô hình Gemini Vision phân tích hình ảnh. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}
