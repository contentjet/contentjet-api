import {Model, RelationMappings, Transaction, QueryBuilderOption} from 'objection';
import ValidationError = require('../errors/ValidationError');
import _ = require('lodash');
import validate from '../utils/validate';

const entryTypeConstraints = {
  name: {
    presence: {
      allowEmpty: false
    },
    length: {
      minimum: 4
    }
  },
  description: {
    length: {
      minimum: 0
    }
  },
  metadata: {
    length: {
      minimum: 0
    }
  },
  projectId: {
    presence: true,
    numericality: {
      onlyInteger: true
    }
  },
  userId: {
    presence: true,
    numericality: {
      onlyInteger: true
    }
  },
  fields: {
    presence: {
      allowEmpty: true
    }
  }
};

const commonFieldConstraints = {
  fieldType: {
    presence: {
      allowEmpty: false
    }
  },
  name: {
    presence: true,
    length: {
      minimum: 4,
      maximum: 64
    }
  },
  label: {
    presence: true,
    length: {
      minimum: 4,
      maximum: 64
    }
  },
  description: {
    presence: {
      allowEmpty: true
    }
  },
  required: {
    boolean: true,
    presence: {
      allowEmpty: false
    }
  },
  disabled: {
    boolean: true,
    presence: {
      allowEmpty: false
    }
  }
};

const textFieldConstraints = {
  minLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 0,
      lessThanOrEqualTo: 999,
      onlyInteger: true
    },
    lessThanAttribute: 'maxLength'
  },
  maxLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 1,
      lessThanOrEqualTo: 1000,
      onlyInteger: true
    }
  },
  format: {
    presence: true,
    inclusion: {
      within: [
        'plaintext',
        'uri',
        'email'
      ],
      message: 'invalid'
    }
  }
};

const longTextFieldConstraints = {
  minLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 0,
      lessThanOrEqualTo: 29999,
      onlyInteger: true
    },
    lessThanAttribute: 'maxLength'
  },
  maxLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 1,
      lessThanOrEqualTo: 50000,
      onlyInteger: true
    }
  },
  format: {
    presence: true,
    inclusion: {
      within: [
        'plaintext',
        'markdown'
      ],
      message: 'invalid'
    }
  }
};

const booleanFieldConstraints = {
  labelTrue: {
    presence: true,
    length: {
      minimum: 1,
      maximum: 32
    }
  },
  labelFalse: {
    presence: true,
    length: {
      minimum: 1,
      maximum: 32
    }
  }
};

const numberFieldConstraints = {
  minValue: {
    numericality: true,
    lessThanAttribute: 'maxValue'
  },
  maxValue: {
    numericality: true
  },
  format: {
    presence: true,
    inclusion: {
      within: [
        'number',
        'integer'
      ],
      message: 'invalid'
    }
  }
};

const dateFieldConstraints = {
  format: {
    presence: true,
    inclusion: {
      within: [
        'datetime',
        'date'
      ],
      message: 'invalid'
    }
  }
};

const choiceFieldConstraints = {
  choices: {
    presence: true,
    arrayLength: {
      minimum: 2,
      maximum: 128
    },
    uniqueArray: true
  },
  format: {
    presence: true,
    inclusion: {
      within: [
        'single',
        'multiple'
      ],
      message: 'invalid'
    }
  }
};

const colorFieldConstraints = {
  format: {
    presence: true,
    inclusion: {
      within: [
        'rgb',
        'rgba'
      ],
      message: 'invalid'
    }
  }
};

const mediaFieldConstraints = {
  minLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 0,
      lessThanOrEqualTo: 999,
      onlyInteger: true
    },
    lessThanAttribute: 'maxLength'
  },
  maxLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 1,
      lessThanOrEqualTo: 1000,
      onlyInteger: true
    }
  }
};

const linkFieldConstraints = {
  minLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 0,
      lessThanOrEqualTo: 999,
      onlyInteger: true
    },
    lessThanAttribute: 'maxLength'
  },
  maxLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 1,
      lessThanOrEqualTo: 1000,
      onlyInteger: true
    }
  }
};

const listFieldConstraints = {
  minLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 0,
      lessThanOrEqualTo: 999,
      onlyInteger: true
    },
    lessThanAttribute: 'maxLength'
  },
  maxLength: {
    presence: true,
    numericality: {
      greaterThanOrEqualTo: 1,
      lessThanOrEqualTo: 1000,
      onlyInteger: true
    }
  }
};

const fieldTypeConstraints = {
  TEXT: Object.assign({}, commonFieldConstraints, textFieldConstraints),
  LONGTEXT: Object.assign({}, commonFieldConstraints, longTextFieldConstraints),
  BOOLEAN: Object.assign({}, commonFieldConstraints, booleanFieldConstraints),
  NUMBER: Object.assign({}, commonFieldConstraints, numberFieldConstraints),
  DATE: Object.assign({}, commonFieldConstraints, dateFieldConstraints),
  CHOICE: Object.assign({}, commonFieldConstraints, choiceFieldConstraints),
  COLOR: Object.assign({}, commonFieldConstraints, colorFieldConstraints),
  MEDIA: Object.assign({}, commonFieldConstraints, mediaFieldConstraints),
  LINK: Object.assign({}, commonFieldConstraints, linkFieldConstraints),
  LIST: Object.assign({}, commonFieldConstraints, listFieldConstraints)
};

const fieldTypes = Object.keys(fieldTypeConstraints);

interface IEntryTypeField {
  name: string;
  label: string;
  description: string;
  required: boolean;
  disabled: boolean;
  fieldType: string;
  format?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  labelTrue?: string;
  labelFalse?: string;
  choices?: string[];
}

export default class EntryType extends Model {

  id: number;
  projectId: number;
  userId: number;
  name: string;
  metadata: string;
  description: string;
  fields: IEntryTypeField[];
  createdAt: Date;
  modifiedAt: Date;

  static get tableName(): string {
    return 'entryType';
  }

  static get relationMappings(): RelationMappings {
    return {
      project: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Project`,
        join: {
          from: 'entryType.projectId',
          to: 'project.id'
        }
      },
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/User`,
        join: {
          from: 'entryType.userId',
          to: 'user.id'
        }
      }
    };
  }

  $beforeValidate(jsonSchema: object, json: any) {
    // Validate top-level fields
    let errors = validate(json, entryTypeConstraints);
    if (errors) {
      let err = new ValidationError();
      err.errors = errors;
      throw err;
    }
    // Validate all fields have unique names
    const fieldNames = json.fields.map(field => field.name);
    if (fieldNames.length !== _.uniq(fieldNames).length) {
      throw new ValidationError('Field names must be unique');
    }
    let fieldErrors = {};
    json.fields.forEach(field => {
      // Validate field type
      let fieldTypeError = validate.single(field.fieldType, {inclusion: fieldTypes});
      if (fieldTypeError) {
        throw new ValidationError(`'${field.fieldType}' is not a valid field type`);
      }
      // Validate each field against it's fieldType constraints
      let constraints = fieldTypeConstraints[field.fieldType];
      let errors = validate(field, constraints);
      if (errors) fieldErrors[field.name] = errors;
    });
    if (!_.isEmpty(fieldErrors)) {
      let err = new ValidationError();
      err.errors = {fields: fieldErrors};
      throw err;
    }
    return jsonSchema;
  }

  static get jsonSchema(): object {
    return {
      'type': 'object',
      'properties': {
        'id': {
          'type': 'integer'
        },
        'name': {
          'type': 'string',
          'minLength': 1,
          'maxLength': 64
        },
        'description': {
          'type': 'string',
          'default': '',
          'maxLength': 128
        },
        'metadata': {
          'type': 'string',
          'default': '',
          'maxLength': 3000
        },
        'projectId': {
          'type': 'integer'
        },
        'userId': {
          'type': 'integer'
        },
        'fields': {
          'type': 'array',
          'items': {
            'oneOf': [
              {
                '$ref': '#/definitions/TEXT'
              },
              {
                '$ref': '#/definitions/LONGTEXT'
              },
              {
                '$ref': '#/definitions/BOOLEAN'
              },
              {
                '$ref': '#/definitions/NUMBER'
              },
              {
                '$ref': '#/definitions/DATE'
              },
              {
                '$ref': '#/definitions/CHOICE'
              },
              {
                '$ref': '#/definitions/COLOR'
              },
              {
                '$ref': '#/definitions/MEDIA'
              },
              {
                '$ref': '#/definitions/LINK'
              },
              {
                '$ref': '#/definitions/LIST'
              }
            ]
          }
        }
      },
      'required': [
        'name',
        'projectId',
        'userId'
      ],
      'definitions': {
        'COMMON_FIELD_PROPERTIES': {
          'type': 'object',
          'properties': {
            'name': {
              'type': 'string',
              'minLength': 4,
              'maxLength': 64
            },
            'label': {
              'type': 'string',
              'minLength': 4,
              'maxLength': 64
            },
            'description': {
              'type': 'string',
              'default': '',
              'maxLength': 128
            },
            'required': {
              'type': 'boolean',
              'default': false
            },
            'disabled': {
              'type': 'boolean',
              'default': false
            }
          },
          'required': [
            'name',
            'label',
            'description',
            'required',
            'disabled'
          ]
        },
        'TEXT': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^TEXT$'
                },
                'minLength': {
                  'type': 'integer',
                  'minimum': 0,
                  'maximum': 999
                },
                'maxLength': {
                  'type': 'integer',
                  'minimum': 1,
                  'maximum': 1000
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'plaintext',
                    'uri',
                    'email'
                  ]
                }
              },
              'required': [
                'fieldType',
                'minLength',
                'maxLength',
                'format'
              ]
            }
          ]
        },
        'LONGTEXT': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^LONGTEXT$'
                },
                'minLength': {
                  'type': 'integer',
                  'minimum': 0,
                  'maximum': 29999
                },
                'maxLength': {
                  'type': 'integer',
                  'minimum': 1,
                  'maximum': 30000
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'plaintext',
                    'markdown'
                  ]
                }
              },
              'required': [
                'fieldType',
                'minLength',
                'maxLength',
                'format'
              ]
            }
          ]
        },
        'BOOLEAN': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^BOOLEAN$'
                },
                'labelTrue': {
                  'type': 'string',
                  'minLength': 1,
                  'maxLength': 32
                },
                'labelFalse': {
                  'type': 'string',
                  'minLength': 1,
                  'maxLength': 32
                }
              },
              'required': [
                'fieldType',
                'labelTrue',
                'labelFalse'
              ]
            }
          ]
        },
        'NUMBER': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^NUMBER$'
                },
                'minValue': {
                  'type': 'number'
                },
                'maxValue': {
                  'type': 'number'
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'number',
                    'integer'
                  ]
                }
              },
              'required': [
                'fieldType',
                'minValue',
                'maxValue',
                'format'
              ]
            }
          ]
        },
        'DATE': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^DATE$'
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'datetime',
                    'date'
                  ]
                }
              },
              'required': [
                'fieldType',
                'format'
              ]
            }
          ]
        },
        'CHOICE': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^CHOICE$'
                },
                'choices': {
                  'type': 'array',
                  'items': {
                    'type': 'string'
                  },
                  'minLength': 2,
                  'maxLength': 128
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'single',
                    'multiple'
                  ]
                }
              },
              'required': [
                'fieldType',
                'choices',
                'format'
              ]
            }
          ]
        },
        'COLOR': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^COLOR$'
                },
                'format': {
                  'type': 'string',
                  'enum': [
                    'rgb',
                    'rgba'
                  ]
                }
              },
              'required': [
                'fieldType',
                'format'
              ]
            }
          ]
        },
        'MEDIA': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^MEDIA$'
                },
                'minLength': {
                  'type': 'integer',
                  'minimum': 0,
                  'maximum': 999
                },
                'maxLength': {
                  'type': 'integer',
                  'minimum': 1,
                  'maximum': 1000
                }
              },
              'required': [
                'fieldType',
                'minLength',
                'maxLength'
              ]
            }
          ]
        },
        'LINK': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^LINK$'
                },
                'minLength': {
                  'type': 'integer',
                  'minimum': 0,
                  'maximum': 999
                },
                'maxLength': {
                  'type': 'integer',
                  'minimum': 1,
                  'maximum': 1000
                }
              },
              'required': [
                'fieldType',
                'minLength',
                'maxLength'
              ]
            }
          ]
        },
        'LIST': {
          'allOf': [
            {
              '$ref': '#/definitions/COMMON_FIELD_PROPERTIES'
            },
            {
              'type': 'object',
              'properties': {
                'fieldType': {
                  'type': 'string',
                  'pattern': '^LIST$'
                },
                'minLength': {
                  'type': 'integer',
                  'minimum': 0,
                  'maximum': 999
                },
                'maxLength': {
                  'type': 'integer',
                  'minimum': 1,
                  'maximum': 1000
                }
              },
              'required': [
                'fieldType',
                'minLength',
                'maxLength'
              ]
            }
          ]
        }
      }
    };
  }

  static getById(id: number, trx?: Transaction): QueryBuilderOption<EntryType> {
    return EntryType.query(trx)
      .where('id', id)
      .first();
  }

  static async existsInProject(id: number, projectId: number, trx?: Transaction): Promise<boolean> {
    const result = await EntryType.query(trx)
      .where({id, projectId})
      .count('*')
      .first() as any;
    return !!parseInt(result.count);
  }

  async validateEntryFields(fields: any, projectId: number): Promise<any> {
    const constraints: any = {};
    for (let field of this.fields) {
      if (field.disabled) continue;
      let fieldConstraints: any = {};
      if (field.required) fieldConstraints.presence = true;
      if (field.fieldType === 'TEXT') {
        if (field.format === 'uri') {
          fieldConstraints.url = true;
        } else if (field.format === 'email') {
          fieldConstraints.email = true;
        }
      } else if (field.fieldType === 'TEXT' || field.fieldType === 'LONGTEXT') {
        fieldConstraints.length = {
          minimum: field.minLength,
          maximum: field.maxLength
        };
      } else if (field.fieldType === 'DATE') {
        if (field.format === 'datetime') {
          fieldConstraints.datetime = true;
        } else if (field.format === 'date') {
          fieldConstraints.date = true;
        }
      } else if (field.fieldType === 'BOOLEAN') {
        fieldConstraints.boolean = true;
      } else if (field.fieldType === 'NUMBER') {
        fieldConstraints.numericality = {
          greaterThanOrEqualTo: field.minValue,
          lessThanOrEqualTo: field.maxValue
        };
        if (field.format === 'integer') {
          fieldConstraints.numericality.onlyInteger = true;
        }
      } else if (field.fieldType === 'CHOICE') {
        fieldConstraints.choicesUnion = {choices: field.choices};
        if (field.format === 'single') {
          fieldConstraints.arrayLength = {is: 1};
        } else if (field.format === 'multiple') {
          fieldConstraints.arrayLength = {minimum: 1};
          fieldConstraints.uniqueArray = true;
        }
      } else if (field.fieldType === 'COLOR') {
        if (field.format === 'rgb') {
          fieldConstraints.format = {
            pattern: /^#[0-9a-fA-F]{6}$/,
            message: 'invalid rgb hex value (should be formatted #000000)'
          };
        } else if (field.format === 'rgba') {
          fieldConstraints.format = {
            pattern: /^#[0-9a-fA-F]{8}$/,
            message: 'invalid rgba hex value (should be formatted #00000000)'
          };
        }
      } else if (field.fieldType === 'MEDIA') {
        fieldConstraints.media = { projectId };
        fieldConstraints.arrayLength = {
          minimum: field.minLength,
          maximum: field.maxLength
        };
      } else if (field.fieldType === 'LINK') {
        fieldConstraints.entries = { projectId };
        fieldConstraints.arrayLength = {
          minimum: field.minLength,
          maximum: field.maxLength
        };
      } else if (field.fieldType === 'LIST') {
        fieldConstraints.arrayOfStrings = true;
        fieldConstraints.arrayLength = {
          minimum: field.minLength,
          maximum: field.maxLength
        };
      }
      constraints[field.name] = fieldConstraints;
    }
    return validate.async(fields, constraints);
  }

  static async deleteAll(trx?: Transaction): Promise<number> {
    const num: any = await EntryType
      .query(trx)
      .delete();
    return num as number;
  }

}
