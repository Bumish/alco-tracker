'use strict';

const {TABLE_SUBSCRIPTIONS} = require('./EventsService');
const pick = require('es6-pick');

class Project {

  constructor(data, pushService){

    this.data = data;

    console.log(`project: ${data.subdomain} [${data.id}] ${data.domain}`);

    this.pushService = pushService;
    this.storage = pushService.getStorage();

  }

  getToken(){
    return this.data['token'];
  }

  getId(){
    return this.data['id'];
  }

  getAccountId(){
    return this.data['account_id'];
  }

  getSubdomain(){
    return this.data['subdomain'];
  }

  getDomain(){
    return this.data['domain'];
  }

  getIconImagePath(){

    return this.data.token.substr(0,2) + '/' + this.data.token + '_icon.png';

  }

  getBadgeImagePath(){

    return this.data.image ? this.data.token.substr(0,2) + '/' + this.data.token + '_badge.png' : undefined;

  }

  getImportantMarks(){

    return ['utm_source', 'utm_medium', 'utm_content', 'utm_term', 'utm_campaign'];

  }

  getWidgetConfig(){
    return {
      showDelay: 5,
      showCustomWidget: false
    }
  }


  getSession(uid){

    return this.storage.getSubscription(uid, this.getId())
      .then(sub => {

        if(!sub){
          sub = {
            id: [uid, this.getId()],
            project_token: this.getToken(),
            project_id: this.getId(),
            updated_at: (new Date()).getTime(),
          }
        }

        return sub;

      });

  }

  updateSession(sub){

    this.storage.saveSubscription(sub)
      .then()
      .catch(e => {
        console.log(e);
      });

  }
}


module.exports = Project;

