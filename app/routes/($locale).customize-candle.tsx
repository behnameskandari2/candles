import { useState } from 'react';
import { json, type ActionFunctionArgs, } from '@shopify/remix-oxygen';
import { useSubmit, useActionData } from '@remix-run/react'
import { AddToCartButton } from '~/components/AddToCartButton';
import { useAside } from '~/components/Aside';


export const action = async ({ request, context }: ActionFunctionArgs) => {
  const apiSecretKey = context.env.OPEN_AI_SECRET;

  if (request.method === "POST") {
    // get the form data from the POST
    const formData = await request.formData()

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiSecretKey}`,
      },
      body: JSON.stringify({
        "model": "gpt-3.5-turbo",
        "response_format": {
          "type": "json_object"
        },
        "messages": [
          {
            "role": "user",
            "content": formData.get("text")
          }
        ]
      }),
    });

    const data = await openaiResponse.json() as any;
    return json({ data: data?.choices[0].message.content, status: 200 })
  }

  return json({ status: 200 })

}


export default function Product() {

  const data = useActionData<typeof action>() as any;
  const { open } = useAside();


  const [questions] = useState<any>([
    {
      "id": 1,
      "question": "Is this candle for you or a gift for someone else?",
      "type": "single-choice",
      "options": ["For Me", "For a Friend"]
    },
    {
      "id": 2,
      "question": "Which best describes your personality (or your friend's)?",
      "type": "single-choice",
      "options": ["Adventurous", "Calm and Collected", "Elegant and Sophisticated", "Fun and Playful", "Warm and Friendly"]
    },
    {
      "id": 3,
      "question": "What activities do you enjoy the most?",
      "type": "multi-choice",
      "options": ["Reading or Writing", "Outdoor Adventures", "Socializing with Friends", "Relaxing at Home", "Creative Pursuits", "Traveling"]
    },
    {
      "id": 4,
      "question": "Which setting feels most like 'home' to you?",
      "type": "single-choice",
      "options": ["A Cozy Cabin", "A Beachside Getaway", "A Mountain Retreat", "A Bustling City", "A Quiet Garden"]
    },
    {
      "id": 5,
      "question": "What scent family appeals to you most?",
      "type": "single-choice",
      "options": ["Woody", "Floral", "Fruity", "Earthy", "Sweet", "Fresh"]
    },
    {
      "id": 6,
      "question": "What kind of mood would you like this candle to evoke?",
      "type": "single-choice",
      "options": ["Relaxed", "Focused", "Energized", "Romantic", "Uplifted"]
    },
    {
      "id": 7,
      "question": "How strong do you like the scent to be?",
      "type": "single-choice",
      "options": ["Subtle", "Medium", "Bold"]
    }, {
      "id": 8,
      "question": "How do you like to call your  candle?",
      "type": "text",
    }
  ]
  )

  const [activeQuestion, setActiveQuestion] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)


  const question = questions.findLast((q: any) => q.id === activeQuestion)


  const [answers, setAnswers] = useState<any>([])

  const submit = useSubmit()

  const renderOptions = () => {


    if (question.type === "text") {

      return <input
        value={answers?.[7]?.answer}
        onChange={(e: any) => [
          addAnswer(e.target.value)
        ]} className='q-text-input' />
    }


    return question.options.map((option: any) => {
      return <button onClick={() => {
        addAnswer(option)
      }} className={`q-option-button ${isActive(option) && "active"}`}>{option}</button>
    })
  }


  const addAnswer = (answer: string) => {

    setAnswers([
      ...answers.slice(0, activeQuestion - 1),
      {
        id: question.id,
        answer: getAnswers(answer)
      },
      ...answers.slice(activeQuestion, 6),
    ])

  }

  const getAnswers = (answer: string) => {

    const selectedOptions = answers.findLast((a: any) => a.id === activeQuestion)

    if (question.type === "text") {
      return answer
    }

    if (question.type === "single-choice") {
      return [answer]
    }

    if (selectedOptions) {
      if (selectedOptions.answer?.includes(answer)) {
        return selectedOptions.answer.filter((a: any) => a !== answer)
      }

      return [...selectedOptions.answer, answer]
    }


    return [answer]


  }

  const isActive = (answer: string) => {
    const selectedOptions = answers.findLast((a: any) => a.id === activeQuestion)
    return selectedOptions?.answer?.includes(answer)
  }

  const generateText = () => {
    return answers.filter(((i: any) => i.id !== 8)).map((a: any) => {

      const question = questions.findLast((q: any) => q.id === a.id)

      return `${question.question}: ${a.answer.join(", ")}`

    })
  }

  const getLines = (oils: any) => {
    const generateAttrs = oils?.map((oil: any) => {
      return {
        key: oil.name,
        value: `${oil.description} | ${oil.oil_amount_in_grams}g`,
      }
    })

    return [
      {
        "merchandiseId": "gid://shopify/ProductVariant/53925347000664",
        "quantity": 1,
        "selectedVariant": {
          "availableForSale": true,
          "compareAtPrice": null,
          "id": "gid://shopify/ProductVariant/53925347000664",
          "image": {
            "__typename": "Image",
            "id": "gid://shopify/ProductImage/72238492713304",
            "url": "https://cdn.shopify.com/s/files/1/0889/4883/4648/files/Candles-BANNER.webp?v=1735778283",
            "altText": null,
            "width": 1350,
            "height": 900
          },
          "price": {
            "amount": "0.0",
            "currencyCode": "EUR"
          },
          "product": {
            "title": "Custom Made Candle",
            "handle": "custom-made-candle-1"
          },
          "selectedOptions": [
            {
              "name": "Title",
              "value": "Default Title"
            }
          ],
          "sku": null,
          "title": "Default Title",
          "unitPrice": null
        },
        "attributes": [
          {
            key: "Your Candle Name",
            value: answers[7].answer
          },
          ...generateAttrs
        ]
      }
    ]

  }






  const generateAICandle = async () => {
    const test = `I want to make a 150 ml scented soy wax candle based on this questions: ${generateText().join(", ")}. give me the essential oils that i need for this candle consider max 10% oils in total, in this response json form: '{oils:[ {name:"", description:"", oil_amount_in_grams:""}]}'`

    const fd = new FormData()
    fd.append("text", test)
    submit(fd, { method: "POST" })

  }


  const renderButtons = () => {

    return <>
      <button className="q-controll-button" disabled={activeQuestion === 1} onClick={() => {
        setActiveQuestion(activeQuestion - 1)
      }}>Preveius Question</button>


      {
        activeQuestion < 8 && <button className="q-controll-button" disabled={activeQuestion === 8} onClick={() => {
          setActiveQuestion(activeQuestion + 1)
        }}>Next Question</button>
      }


      {
        activeQuestion === 8 && <button className="q-controll-button" onClick={() => {
          generateAICandle()
          setIsSubmitting(true)
        }}>Submit</button>
      }
    </>
  }


  const renderQuestions = () => {
    return <>

      {renderStepper()}


      <div className="question">

        <div className="q-title">
          <h3>{question.question}</h3>
        </div>

        <div className="q-options">
          {renderOptions()}
        </div>

        <div className="q-controll">
          {renderButtons()}
        </div>

      </div></>
  }


  const renderSubmitting = () => {

    const oils = data && (JSON.parse(data.data) as any)?.oils

    return <>
      <h1 className="title">Your candle is ready!</h1>

      <div className="candle">

        {oils?.map((oils: any) => {
          return <div>
            <div><h4>{oils.name}</h4></div>
            <div><span>{oils.description}</span></div>
            <div><span>{oils.oil_amount_in_grams}g</span></div>
          </div>
        })}



      </div>

      {

        oils?.length && <AddToCartButton

          onClick={() => {
            open('cart');
          }}
          lines={getLines(oils)}

        >
          Add to cart
        </AddToCartButton>
      }



    </>
  }

  const renderStepper = () => {


    const stepper = questions.map((q: any) => {

      const hasAnswer = answers.some((a: any) => a.id === q.id)

      return <span onClick={() => {
        if (hasAnswer) {
          setActiveQuestion(q.id)

        }
      }} className={`stepper ${q.id <= activeQuestion ? "active_stepper" : ""} ${hasAnswer ? "has-answer" : ""}`}></span>
    })

    return <div className="stepper-container">
      {stepper}
    </div>
  }





  return (
    <div className="questionnaire">


      {!isSubmitting && renderQuestions()}
      {isSubmitting && renderSubmitting()}


    </div>
  );
}
