---
type: Card
hello: world
count: 0
---

# Card title

This text will never be used in the game, but is simply a place where comments can live. A card is divided in different 1 of more scenarios, which can be triggered based on local or other global state in the game.

You can place code blocks in this part of the template which will be executed every time the card is shown. The code block below will update the _count_ value each time, regardless of which scenario is active.

```set-state
count = count + 1
```

## Second visit

This scenario is only triggered once there the _count_ condition is equal to 1.

```condition
count = 1
```

What is your name?

1. Next: [[Card]]

## All remaining visits

```condition
count >= 2
hello = world
```

This is visit number {{ count }}

1. Visit again: [[Card]]
2. Quit the game

## First visit

Since no conditions were met in the other scenarios, this will be the first scenario triggered on this card. What would you like to do?

You see a person. Awesome.

1. Visit the card again: [[Card]]
2. Talk to [[Character]]: [[Conversation]]
3. Go to Book-a-Like
4. Quit the game: [[End]]
