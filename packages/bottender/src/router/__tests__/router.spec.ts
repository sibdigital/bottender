import { run } from '../../bot/Bot';

import router, { payload, route, text } from '..';

function textContext(message = '') {
  return {
    sendText: jest.fn(),
    event: {
      isText: true,
      isPayload: false,
      text: message,
    },
  };
}

function payloadContext(message = '') {
  return {
    sendText: jest.fn(),
    event: {
      isText: false,
      isPayload: true,
      payload: message,
    },
  };
}

function textAction(message) {
  return async function(context) {
    await context.sendText(message);
  };
}

async function expectConversation(app, message, expectedReply) {
  const context = textContext(message);
  await app(context);
  if (expectedReply == null) {
    expect(context.sendText).not.toBeCalled();
  } else {
    expect(context.sendText).toBeCalledWith(expectedReply);
  }
}

async function expectPayloadConversation(app, message, expectedReply) {
  const context = payloadContext(message);
  await app(context);
  if (expectedReply == null) {
    expect(context.sendText).not.toBeCalled();
  } else {
    expect(context.sendText).toBeCalledWith(expectedReply);
  }
}

describe('#router', () => {
  it('should work with raw route format', async () => {
    const Router = router([
      {
        predicate: () => true,
        action: textAction('hello'),
      },
    ]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
  });

  it('should return next if not match any route', async () => {
    const Router = router([
      {
        predicate: () => false,
        action: textAction('hello'),
      },
    ]);

    const props = {
      next: textAction('next'),
    };

    const app = run(Router);
    const context = textContext('hi');
    await app(context, props);
    expect(context.sendText).toBeCalledWith('next');
  });
});

describe('#route', () => {
  it('should work with *', async () => {
    const Router = router([route('*', textAction('hello'))]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectConversation(app, 'yo', 'hello');
  });

  it('should work with predicate', async () => {
    const Router = router([
      route(
        context => context.event.isText && context.event.text.startsWith('h'),
        textAction('hello')
      ),
    ]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectPayloadConversation(app, 'hi', null);
  });
});

describe('#text', () => {
  it('should work with string', async () => {
    const Router = router([text('hi', textAction('hello'))]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectConversation(app, 'yo', null);
    await expectPayloadConversation(app, 'hi', null);
  });

  it('should work with array of string', async () => {
    const Router = router([text(['hi', 'hello'], textAction('hello'))]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectConversation(app, 'hello', 'hello');
    await expectConversation(app, 'yo', null);
    await expectPayloadConversation(app, 'hi', null);
  });

  it('should work with regexp', async () => {
    const Router = router([text(/(hi|hello)/, textAction('hello'))]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectConversation(app, 'hello', 'hello');
    await expectConversation(app, 'yo', null);
    await expectPayloadConversation(app, 'hi', null);
  });

  it('should work with regexp match', async () => {
    const action = jest.fn();
    const Router = router([text(/number: (\d+)/, action)]);

    const app = run(Router);
    const context = textContext('number: 123');
    await app(context);
    const expectedProps = { match: ['number: 123', '123'], next: undefined };
    expect(action).toBeCalledWith(context, expectedProps, context, {});
    // expect(action).toBeCalledWith(1,2,3)
  });

  it('should work with *', async () => {
    const Router = router([text('*', textAction('hello'))]);

    const app = run(Router);
    await expectConversation(app, 'hi', 'hello');
    await expectConversation(app, 'hello', 'hello');
    await expectConversation(app, 'yo', 'hello');
    await expectPayloadConversation(app, 'hi', null);
  });
});

describe('#payload', () => {
  it('should work with string', async () => {
    const Router = router([payload('hi', textAction('hello'))]);

    const app = run(Router);
    await expectPayloadConversation(app, 'hi', 'hello');
    await expectPayloadConversation(app, 'hello', null);
    await expectPayloadConversation(app, 'yo', null);
    await expectConversation(app, 'hi', null);
  });

  it('should work with array of string', async () => {
    const Router = router([payload(['hi', 'hello'], textAction('hello'))]);

    const app = run(Router);
    await expectPayloadConversation(app, 'hi', 'hello');
    await expectPayloadConversation(app, 'hello', 'hello');
    await expectPayloadConversation(app, 'yo', null);
    await expectConversation(app, 'hi', null);
  });

  it('should work with regexp', async () => {
    const Router = router([payload(/(hi|hello)/, textAction('hello'))]);

    const app = run(Router);
    await expectPayloadConversation(app, 'hi', 'hello');
    await expectPayloadConversation(app, 'hello', 'hello');
    await expectPayloadConversation(app, 'yo', null);
    await expectConversation(app, 'hi', null);
  });

  it('should work with *', async () => {
    const Router = router([payload('*', textAction('hello'))]);

    const app = run(Router);
    await expectPayloadConversation(app, 'hi', 'hello');
    await expectPayloadConversation(app, 'hello', 'hello');
    await expectPayloadConversation(app, 'yo', 'hello');
    await expectConversation(app, 'hi', null);
  });
});
