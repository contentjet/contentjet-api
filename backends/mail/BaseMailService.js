class BaseMailService {

  sendMail(data) {
    throw new Error('Abstract method must be extended by sub class');
  }

}

module.exports = BaseMailService;
