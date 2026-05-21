import { ApplicationError } from "./ApplicationError";

export class ProjectAlreadyExistsError extends ApplicationError {
  constructor(name: string) {
    super(`Project with name '${name}' already exists in this tenant.`);
    this.name = "ProjectAlreadyExistsError";
  }
}
