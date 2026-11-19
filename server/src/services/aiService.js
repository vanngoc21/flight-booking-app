
const OpenAI = require('openai');
const { searchFlightsForAI } = require('./aiFlightService');

// Khởi tạo OpenAI khi thực sự cần gọi API.
// Tránh lỗi ngay lúc server import file nếu chưa cấu hình API key.
let openai;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Chưa cấu hình OPENAI_API_KEY.');
  }

  if (!process.env.OPENAI_MODEL) {
    throw new Error('Chưa cấu hình OPENAI_MODEL.');
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openai;
}

const tools = [
  {
    type: 'function',
    name: 'search_flights',
    description: 'Tìm chuyến bay thực tế trong cơ sở dữ liệu Flight Booking.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Mã sân bay đi gồm 3 ký tự.',
        },
        to: {
          type: 'string',
          description: 'Mã sân bay đến gồm 3 ký tự.',
        },
        date: {
          type: 'string',
          description: 'Ngày bay YYYY-MM-DD.',
        },
        maxPrice: {
          type: ['number', 'null'],
          description: 'Giá tối đa, hoặc null nếu không giới hạn.',
        },
        sort: {
          type: 'string',
          enum: ['best', 'cheapest', 'fastest'],
        },
        cabinClass: {
          type: 'string',
          enum: ['economy', 'premium_economy', 'business', 'first'],
        },
      },
      required: [
        'from',
        'to',
        'date',
        'maxPrice',
        'sort',
        'cabinClass',
      ],
      additionalProperties: false,
    },
  },
];

const SYSTEM_PROMPT = `
Bạn là SKYHAVEN AI, trợ lý đặt vé máy bay của ứng dụng Flight Booking.

Nhiệm vụ:
1. Trả lời tự nhiên, lịch sự theo ngôn ngữ được chỉ định, bám sát câu hỏi.
2. Tư vấn hành trình và tìm chuyến bay bằng dữ liệu từ hệ thống.
3. So sánh giá, thời gian bay, hãng bay và các lựa chọn phù hợp.
4. Giải thích quy trình đặt vé theo từng bước, dùng gạch đầu dòng khi giúp câu trả lời dễ đọc hơn.

Quy tắc:
- Không tự tạo chuyến bay, mã chuyến bay hoặc giá vé.
- Chỉ khẳng định thông tin chuyến bay, chỗ trống và giá khi có dữ liệu trả về từ công cụ tìm kiếm; giá và chỗ có thể thay đổi cho đến khi booking được xác nhận.
- Nếu thiếu điểm đi, điểm đến hoặc ngày bay, hãy hỏi ngắn gọn để bổ sung các thông tin còn thiếu.
- Nếu người dùng không chỉ định hạng ghế, mặc định economy.
- Nếu người dùng không chỉ định ngân sách, đặt maxPrice là null.
- Nếu người dùng yêu cầu giá thấp, chọn sort là cheapest.
- Nếu người dùng yêu cầu bay nhanh, chọn sort là fastest.
- Nếu người dùng không yêu cầu cụ thể, chọn sort là best.
- Khi đủ thông tin, sử dụng function search_flights.
- Chỉ giới thiệu chuyến bay được trả về từ công cụ.
- Nếu không có chuyến phù hợp, nói rõ kết quả và gợi ý thử ngày khác hoặc nới ngân sách; không bịa phương án.
- Không nói rằng đã đặt vé, giữ ghế hoặc thanh toán; người dùng phải hoàn tất các bước đó trong ứng dụng.
- Không yêu cầu hoặc nhận số CCCD, hộ chiếu, visa, mật khẩu, OTP hay thông tin thẻ qua khung chat. Hướng dẫn nhập giấy tờ trong biểu mẫu đặt vé của ứng dụng.
- Không khẳng định quy định visa, nhập cảnh hoặc giấy tờ là mới nhất nếu chưa được xác minh. Nêu rõ yêu cầu tùy quốc gia, hãng và hành trình; hướng dẫn người dùng kiểm tra với cơ quan chính thức và hãng bay.
- Ưu tiên câu trả lời ngắn, rõ, có bước tiếp theo cụ thể; nếu chưa chắc, nói rõ giới hạn thay vì đoán.
`;

function validateFlightArguments(args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throw new Error('Tham số tìm kiếm không hợp lệ.');
  }

  const { from, to, date, maxPrice, sort, cabinClass } = args;

  if (
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    !/^[A-Z]{3}$/i.test(from) ||
    !/^[A-Z]{3}$/i.test(to) ||
    from.toUpperCase() === to.toUpperCase()
  ) {
    throw new Error('Mã sân bay không hợp lệ.');
  }

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  ) {
    throw new Error('Ngày bay không hợp lệ.');
  }

  if (
    maxPrice !== null &&
    (
      typeof maxPrice !== 'number' ||
      !Number.isFinite(maxPrice) ||
      maxPrice <= 0
    )
  ) {
    throw new Error('Ngân sách không hợp lệ.');
  }

  if (!['best', 'cheapest', 'fastest'].includes(sort)) {
    throw new Error('Kiểu sắp xếp không hợp lệ.');
  }

  if (
    !['economy', 'premium_economy', 'business', 'first']
      .includes(cabinClass)
  ) {
    throw new Error('Hạng ghế không hợp lệ.');
  }
}

async function askAI(message, previousMessages = [], language = 'vi') {
  const client = getOpenAIClient();

  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.length > 2000
  ) {
    throw new Error('Nội dung câu hỏi không hợp lệ.');
  }

  if (!['vi', 'en'].includes(language)) {
    throw new Error('Ngôn ngữ trò chuyện không hợp lệ.');
  }

  if (!Array.isArray(previousMessages)) {
    throw new Error('Lịch sử hội thoại không hợp lệ.');
  }

  const history = previousMessages.slice(-10).map((item) => {
    if (
      !item ||
      !['user', 'assistant'].includes(item.role) ||
      typeof item.content !== 'string'
    ) {
      throw new Error('Lịch sử hội thoại không hợp lệ.');
    }

    return {
      role: item.role,
      content: item.content.slice(0, 2000),
    };
  });

  let response = await client.responses.create({
    model: process.env.OPENAI_MODEL,
    instructions: `${SYSTEM_PROMPT}\n\n${language === 'en'
      ? 'Reply in clear, polite English. Keep airline, airport, and flight identifiers unchanged.'
      : 'Trả lời tự nhiên, lịch sự bằng tiếng Việt.'}`,
    input: [
      ...history,
      {
        role: 'user',
        content: message.trim(),
      },
    ],
    tools,
  });

  let attempts = 0;
  const MAX_TOOL_CALLS = 5;

  while (true) {
    const toolCalls = response.output.filter(
      (item) => item.type === 'function_call'
    );

    if (toolCalls.length === 0) {
      return (
        response.output_text ||
        'Xin lỗi, tôi chưa thể tạo câu trả lời.'
      );
    }

    if (attempts + toolCalls.length > MAX_TOOL_CALLS) {
      throw new Error('AI vượt quá số lần gọi công cụ cho phép.');
    }

    attempts += toolCalls.length;

    const toolOutputs = [];

    for (const toolCall of toolCalls) {
      if (toolCall.name !== 'search_flights') {
        throw new Error('AI yêu cầu công cụ không được hỗ trợ.');
      }

      let result;

      try {
        const args = JSON.parse(toolCall.arguments);

        validateFlightArguments(args);

        const flights = await searchFlightsForAI({
          ...args,
          from: args.from.toUpperCase(),
          to: args.to.toUpperCase(),
        });

        result = {
          success: true,
          count: flights.length,
          data: flights,
        };
      } catch (error) {
        // Chỉ gửi lỗi nghiệp vụ đã biết cho AI.
        // Không chuyển lỗi MongoDB hoặc lỗi nội bộ nguyên bản.
        const safeMessages = [
          'Mã sân bay không hợp lệ.',
          'Ngày bay không hợp lệ.',
          'Ngân sách không hợp lệ.',
          'Kiểu sắp xếp không hợp lệ.',
          'Hạng ghế không hợp lệ.',
          'Tham số tìm kiếm không hợp lệ.',
        ];

        result = {
          success: false,
          message: safeMessages.includes(error.message)
            ? error.message
            : 'Không thể thực hiện tìm kiếm chuyến bay lúc này.',
          data: [],
        };
      }

      toolOutputs.push({
        type: 'function_call_output',
        call_id: toolCall.call_id,
        output: JSON.stringify(result),
      });
    }

    response = await client.responses.create({
      model: process.env.OPENAI_MODEL,
      instructions: `${SYSTEM_PROMPT}\n\n${language === 'en'
        ? 'Reply in clear, polite English. Keep airline, airport, and flight identifiers unchanged.'
        : 'Trả lời tự nhiên, lịch sự bằng tiếng Việt.'}`,
      previous_response_id: response.id,
      input: toolOutputs,
      tools,
    });
  }
}

module.exports = {
  askAI,
};
