import * as ts from 'typescript';

type BooleanOptionExpectation = Readonly<Record<string, boolean>>;

type EventListenerExpectation = {
  options?: BooleanOptionExpectation;
  handlerName?: string;
};

type BindingMap = Map<string, ts.Expression>;

const MAX_RESOLVE_DEPTH = 12;

function propertyNameText(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) return name.expression.text;
  return undefined;
}

function memberName(expression: ts.Expression): string | undefined {
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  if (ts.isElementAccessExpression(expression) && expression.argumentExpression) {
    return resolveStringLiteral(expression.argumentExpression, new Map());
  }
  if (ts.isIdentifier(expression)) return expression.text;
  return undefined;
}

function collectConstBindings(sourceFile: ts.SourceFile): BindingMap {
  const bindings: BindingMap = new Map();

  const visit = (node: ts.Node) => {
    if (ts.isVariableStatement(node) && (node.declarationList.flags & ts.NodeFlags.Const) !== 0) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          bindings.set(declaration.name.text, declaration.initializer);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return bindings;
}

function resolveExpression(expression: ts.Expression, bindings: BindingMap, depth = 0): ts.Expression {
  if (depth >= MAX_RESOLVE_DEPTH || !ts.isIdentifier(expression)) return expression;
  const bound = bindings.get(expression.text);
  if (!bound || bound === expression) return expression;
  return resolveExpression(bound, bindings, depth + 1);
}

function resolveStringLiteral(expression: ts.Expression, bindings: BindingMap, depth = 0): string | undefined {
  if (depth >= MAX_RESOLVE_DEPTH) return undefined;
  const resolved = resolveExpression(expression, bindings, depth);
  if (ts.isStringLiteral(resolved) || ts.isNoSubstitutionTemplateLiteral(resolved)) return resolved.text;
  if (ts.isParenthesizedExpression(resolved)) return resolveStringLiteral(resolved.expression, bindings, depth + 1);
  return undefined;
}

function resolveBooleanLiteral(expression: ts.Expression, bindings: BindingMap, depth = 0): boolean | undefined {
  if (depth >= MAX_RESOLVE_DEPTH) return undefined;
  const resolved = resolveExpression(expression, bindings, depth);
  if (resolved.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (resolved.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isParenthesizedExpression(resolved)) return resolveBooleanLiteral(resolved.expression, bindings, depth + 1);
  return undefined;
}

function resolveObjectLiteral(expression: ts.Expression, bindings: BindingMap, depth = 0): ts.ObjectLiteralExpression | undefined {
  if (depth >= MAX_RESOLVE_DEPTH) return undefined;
  const resolved = resolveExpression(expression, bindings, depth);
  if (ts.isObjectLiteralExpression(resolved)) return resolved;
  if (ts.isParenthesizedExpression(resolved)) return resolveObjectLiteral(resolved.expression, bindings, depth + 1);
  return undefined;
}

function objectBooleanOption(
  expression: ts.Expression | undefined,
  key: string,
  bindings: BindingMap,
  depth = 0,
): boolean | undefined {
  if (!expression || depth >= MAX_RESOLVE_DEPTH) return undefined;
  const object = resolveObjectLiteral(expression, bindings, depth);
  if (!object) return undefined;

  // Object properties and spreads use JavaScript's left-to-right, last-write-wins semantics.
  let resolvedValue: boolean | undefined;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      const spreadValue = objectBooleanOption(property.expression, key, bindings, depth + 1);
      if (spreadValue !== undefined) resolvedValue = spreadValue;
      continue;
    }

    if (ts.isPropertyAssignment(property) && propertyNameText(property.name) === key) {
      const propertyValue = resolveBooleanLiteral(property.initializer, bindings, depth + 1);
      if (propertyValue !== undefined) resolvedValue = propertyValue;
      continue;
    }

    if (ts.isShorthandPropertyAssignment(property) && property.name.text === key) {
      const bound = bindings.get(property.name.text);
      const shorthandValue = bound ? resolveBooleanLiteral(bound, bindings, depth + 1) : undefined;
      if (shorthandValue !== undefined) resolvedValue = shorthandValue;
    }
  }

  return resolvedValue;
}

function identifierName(expression: ts.Expression, bindings: BindingMap, depth = 0): string | undefined {
  if (depth >= MAX_RESOLVE_DEPTH) return undefined;
  if (ts.isIdentifier(expression)) {
    const bound = bindings.get(expression.text);
    if (bound && ts.isIdentifier(bound)) return identifierName(bound, bindings, depth + 1);
    return expression.text;
  }
  return undefined;
}

function walk(sourceFile: ts.SourceFile, predicate: (node: ts.Node) => boolean): boolean {
  let matched = false;
  const visit = (node: ts.Node) => {
    if (matched) return;
    if (predicate(node)) {
      matched = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return matched;
}

export function inspectSource(source: string, fileName = 'contract.tsx') {
  const scriptKind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKind);
  const bindings = collectConstBindings(sourceFile);

  const hasModuleImport = (moduleName: string): boolean => walk(sourceFile, (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      return node.moduleSpecifier.text === moduleName;
    }
    if (!ts.isCallExpression(node) || node.expression.kind !== ts.SyntaxKind.ImportKeyword) return false;
    return node.arguments.length === 1 && resolveStringLiteral(node.arguments[0], bindings) === moduleName;
  });

  const hasMethodCall = (method: string): boolean => walk(sourceFile, (node) =>
    ts.isCallExpression(node) && memberName(node.expression) === method,
  );

  const hasMethodCallWithBooleanOptions = (
    method: string,
    options: BooleanOptionExpectation,
    optionsArgumentIndex = 0,
  ): boolean => walk(sourceFile, (node) => {
    if (!ts.isCallExpression(node) || memberName(node.expression) !== method) return false;
    const argument = node.arguments[optionsArgumentIndex];
    return Object.entries(options).every(([key, expected]) => objectBooleanOption(argument, key, bindings) === expected);
  });

  const hasEventListener = (eventName: string, expectation: EventListenerExpectation = {}): boolean => walk(
    sourceFile,
    (node) => {
      if (!ts.isCallExpression(node) || memberName(node.expression) !== 'addEventListener') return false;
      if (resolveStringLiteral(node.arguments[0], bindings) !== eventName) return false;

      if (expectation.handlerName) {
        const handler = node.arguments[1];
        if (!handler || identifierName(handler, bindings) !== expectation.handlerName) return false;
      }

      if (expectation.options) {
        const optionsArgument = node.arguments[2];
        if (!Object.entries(expectation.options).every(
          ([key, expected]) => objectBooleanOption(optionsArgument, key, bindings) === expected,
        )) return false;
      }

      return true;
    },
  );

  return {
    hasModuleImport,
    hasMethodCall,
    hasMethodCallWithBooleanOptions,
    hasEventListener,
  };
}
