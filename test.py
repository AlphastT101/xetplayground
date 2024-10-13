from openai import OpenAI

client = OpenAI(
  base_url="https://api.xet.one/v1",
  api_key="luminary-7WqNpkBMv5f2FHjhPPA0WQDwQbdjfMDNkFU2Xe7x",
)

message = []
while True:
  user = input("You: ")
  user_dict = {
    "role": "user",
    "content": user
  }
  message.append(user_dict)
  completion = client.chat.completions.create(
    model="gpt-4-turbo",
    messages=message
  )

  ai_dict = {
    "role": "assistant",
    "content": completion.response
  }
  message.append(ai_dict)
  print(f"AI: {completion.response}")